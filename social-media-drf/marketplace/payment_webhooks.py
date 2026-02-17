try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    stripe = None
    STRIPE_AVAILABLE = False

import logging
import json
from datetime import datetime, timezone as dt_timezone
from django.conf import settings
from django.db import transaction, IntegrityError
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from django.contrib.auth import get_user_model
from .models import SubscriptionPlan, UserSubscription, Payment, StripeWebhookEvent

User = get_user_model()
logger = logging.getLogger(__name__)

if STRIPE_AVAILABLE:
    stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None)
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
else:
    webhook_secret = None


def _to_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromtimestamp(float(value), tz=dt_timezone.utc)
    except Exception:
        return None


def _find_user_for_subscription(stripe_subscription):
    metadata = stripe_subscription.get('metadata', {})
    user_id = metadata.get('user_id')

    if user_id:
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            pass

    sub = UserSubscription.objects.filter(
        stripe_subscription_id=stripe_subscription.get('id')
    ).select_related('user').first()
    if sub:
        return sub.user

    customer_id = stripe_subscription.get('customer')
    sub = UserSubscription.objects.filter(
        stripe_customer_id=customer_id
    ).select_related('user').first()
    if sub:
        return sub.user

    return None


def _resolve_plan_from_subscription(stripe_subscription):
    items = stripe_subscription.get('items', {}).get('data', [])
    if not items:
        return None
    price_id = items[0].get('price', {}).get('id')
    if not price_id:
        return None
    return SubscriptionPlan.objects.filter(stripe_price_id=price_id).first()


def _upsert_local_subscription(user, stripe_subscription):
    plan = _resolve_plan_from_subscription(stripe_subscription)
    local_sub, _created = UserSubscription.objects.get_or_create(
        user=user,
        stripe_subscription_id=stripe_subscription.get('id'),
        defaults={
            'plan': plan,
            'status': stripe_subscription.get('status', 'incomplete'),
            'stripe_customer_id': stripe_subscription.get('customer'),
            'current_period_start': _to_datetime(stripe_subscription.get('current_period_start')),
            'current_period_end': _to_datetime(stripe_subscription.get('current_period_end')),
            'cancel_at_period_end': stripe_subscription.get('cancel_at_period_end', False),
        },
    )

    local_sub.plan = plan
    local_sub.status = stripe_subscription.get('status', local_sub.status)
    local_sub.stripe_customer_id = stripe_subscription.get('customer') or local_sub.stripe_customer_id
    local_sub.current_period_start = _to_datetime(stripe_subscription.get('current_period_start'))
    local_sub.current_period_end = _to_datetime(stripe_subscription.get('current_period_end'))
    local_sub.cancel_at_period_end = stripe_subscription.get('cancel_at_period_end', False)
    local_sub.save(update_fields=[
        'plan',
        'status',
        'stripe_customer_id',
        'current_period_start',
        'current_period_end',
        'cancel_at_period_end',
        'updated_at',
    ])

    return local_sub


def _record_invoice_payment(invoice):
    subscription_id = invoice.get('subscription')
    customer_id = invoice.get('customer')
    status = invoice.get('status')
    invoice_id = invoice.get('id')
    amount_paid = (invoice.get('amount_paid') or 0) / 100
    payment_intent_id = invoice.get('payment_intent')

    if not subscription_id and not customer_id:
        return

    local_sub = None
    if subscription_id:
        local_sub = UserSubscription.objects.filter(stripe_subscription_id=subscription_id).select_related('user', 'plan').first()
    if not local_sub and customer_id:
        local_sub = UserSubscription.objects.filter(stripe_customer_id=customer_id).select_related('user', 'plan').order_by('-created_at').first()

    if not local_sub:
        logger.warning("Unable to map invoice %s to a local subscription", invoice_id)
        return

    payment_status = 'succeeded' if status == 'paid' else 'failed'

    defaults = {
        'user': local_sub.user,
        'subscription': local_sub,
        'payment_type': 'subscription',
        'amount': amount_paid,
        'currency': (invoice.get('currency') or 'usd').lower(),
        'status': payment_status,
        'description': f"Subscription payment for {local_sub.plan.display_name if local_sub.plan else 'plan'}",
        'metadata': {
            'invoice_id': invoice_id,
            'subscription_id': subscription_id,
        },
    }

    if payment_intent_id:
        Payment.objects.update_or_create(
            stripe_payment_intent_id=payment_intent_id,
            defaults=defaults,
        )
        return

    existing = Payment.objects.filter(metadata__invoice_id=invoice_id).first()
    if existing:
        for key, value in defaults.items():
            setattr(existing, key, value)
        existing.save()
    else:
        Payment.objects.create(
            stripe_payment_intent_id=None,
            **defaults,
        )


@csrf_exempt
@require_POST
def stripe_webhook(request):
    if not STRIPE_AVAILABLE or not stripe.api_key:
        return HttpResponse("Stripe not configured", status=503)

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = json.loads(payload.decode('utf-8'))
    except ValueError as exc:
        logger.error("Invalid webhook payload: %s", str(exc))
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as exc:
        logger.error("Invalid webhook signature: %s", str(exc))
        return HttpResponse(status=400)
    except Exception as exc:
        logger.error("Webhook parse error: %s", str(exc), exc_info=True)
        return HttpResponse(status=400)

    event_type = event['type']
    event_id = event.get('id')
    obj = event['data']['object']

    try:
        with transaction.atomic():
            if event_id:
                StripeWebhookEvent.objects.create(
                    event_id=event_id,
                    event_type=event_type,
                )

            if event_type in {'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'}:
                user = _find_user_for_subscription(obj)
                if user:
                    _upsert_local_subscription(user, obj)
                else:
                    logger.warning("No user found for Stripe subscription event %s", obj.get('id'))

            elif event_type == 'checkout.session.completed':
                if obj.get('mode') != 'subscription':
                    return HttpResponse(status=200)

                subscription_id = obj.get('subscription')
                if not subscription_id:
                    return HttpResponse(status=200)

                stripe_subscription = stripe.Subscription.retrieve(subscription_id)

                user = _find_user_for_subscription(stripe_subscription)
                if not user:
                    metadata = obj.get('metadata', {})
                    user_id = metadata.get('user_id')
                    if user_id:
                        user = User.objects.filter(id=user_id).first()

                if user:
                    _upsert_local_subscription(user, stripe_subscription)

            elif event_type == 'invoice.payment_succeeded':
                _record_invoice_payment(obj)
                sub_id = obj.get('subscription')
                if sub_id:
                    UserSubscription.objects.filter(stripe_subscription_id=sub_id).update(status='active')

            elif event_type == 'invoice.payment_failed':
                _record_invoice_payment(obj)
                sub_id = obj.get('subscription')
                if sub_id:
                    UserSubscription.objects.filter(stripe_subscription_id=sub_id).update(status='past_due')

    except IntegrityError:
        # Duplicate delivery from Stripe retry/backfill: acknowledge without reprocessing.
        logger.info("Duplicate Stripe webhook ignored: %s (%s)", event_type, event_id)
        return HttpResponse(status=200)
    except Exception as exc:
        logger.error("Error handling Stripe webhook %s: %s", event_type, str(exc), exc_info=True)
        return HttpResponse(status=500)

    return HttpResponse(status=200)
