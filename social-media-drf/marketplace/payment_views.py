try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    stripe = None
    STRIPE_AVAILABLE = False

import logging
from datetime import datetime, timezone as dt_timezone
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdmin
from post.notifications import notify_admins
from .models import SubscriptionPlan, UserSubscription, Payment, PostCredit
from .payment_serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    PaymentSerializer,
    PostCreditSerializer,
    SubscriptionUsageSerializer,
)
from .views import success_response, error_response

logger = logging.getLogger(__name__)

if STRIPE_AVAILABLE:
    stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None)

ACTIVE_SUBSCRIPTION_STATUSES = {'active', 'trialing'}


def _to_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromtimestamp(float(value), tz=dt_timezone.utc)
    except Exception:
        return None


def _is_admin(user):
    return getattr(user, 'role', None) == 'admin' or getattr(user, 'is_staff', False)


def _get_or_create_customer(user):
    latest_sub = UserSubscription.objects.filter(user=user).order_by('-created_at').first()
    customer_id = latest_sub.stripe_customer_id if latest_sub else None

    if customer_id:
        return customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.username,
        metadata={'user_id': str(user.id)},
    )
    return customer.id


def _get_current_subscription(user):
    return UserSubscription.objects.filter(
        user=user,
        status__in=ACTIVE_SUBSCRIPTION_STATUSES,
    ).order_by('-created_at').first()


def _upsert_subscription_from_stripe(user, stripe_subscription, fallback_plan=None):
    price_id = None
    items = stripe_subscription.get('items', {}).get('data', [])
    if items:
        price_id = items[0].get('price', {}).get('id')

    plan = SubscriptionPlan.objects.filter(stripe_price_id=price_id, is_active=True).first()
    if not plan:
        plan = fallback_plan

    subscription = UserSubscription.objects.filter(
        user=user,
        stripe_subscription_id=stripe_subscription.get('id'),
    ).first()

    if not subscription:
        subscription = UserSubscription.objects.create(
            user=user,
            plan=plan,
            status=stripe_subscription.get('status', 'incomplete'),
            stripe_subscription_id=stripe_subscription.get('id'),
            stripe_customer_id=stripe_subscription.get('customer'),
            current_period_start=_to_datetime(stripe_subscription.get('current_period_start')),
            current_period_end=_to_datetime(stripe_subscription.get('current_period_end')),
            cancel_at_period_end=stripe_subscription.get('cancel_at_period_end', False),
        )
        return subscription

    subscription.plan = plan
    subscription.status = stripe_subscription.get('status', subscription.status)
    subscription.stripe_customer_id = stripe_subscription.get('customer') or subscription.stripe_customer_id
    subscription.current_period_start = _to_datetime(stripe_subscription.get('current_period_start'))
    subscription.current_period_end = _to_datetime(stripe_subscription.get('current_period_end'))
    subscription.cancel_at_period_end = stripe_subscription.get('cancel_at_period_end', False)
    subscription.save(update_fields=[
        'plan',
        'status',
        'stripe_customer_id',
        'current_period_start',
        'current_period_end',
        'cancel_at_period_end',
        'updated_at',
    ])
    return subscription


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_active']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = SubscriptionPlan.objects.all().order_by('price')
        if _is_admin(self.request.user):
            return queryset
        return queryset.filter(is_active=True)

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.filter_queryset(self.get_queryset()), many=True)
        return success_response("Subscription plans retrieved successfully.", serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get('is_recommended'):
            SubscriptionPlan.objects.filter(is_recommended=True).update(is_recommended=False)

        plan = serializer.save()
        return success_response("Subscription plan created successfully.", self.get_serializer(plan).data, status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get('is_recommended') and not instance.is_recommended:
            SubscriptionPlan.objects.filter(is_recommended=True).exclude(id=instance.id).update(is_recommended=False)

        plan = serializer.save()
        return success_response("Subscription plan updated successfully.", self.get_serializer(plan).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        plan = self.get_object()
        plan.is_active = not plan.is_active
        plan.save(update_fields=['is_active', 'updated_at'])
        status_text = "activated" if plan.is_active else "deactivated"
        return success_response(f"Subscription plan {status_text} successfully.", self.get_serializer(plan).data)

    def destroy(self, request, *args, **kwargs):
        plan = self.get_object()
        active_subscriptions = UserSubscription.objects.filter(plan=plan, status__in=ACTIVE_SUBSCRIPTION_STATUSES)
        if active_subscriptions.exists():
            return error_response(
                "Cannot delete plan with active subscriptions. Deactivate it first.",
                status.HTTP_400_BAD_REQUEST,
            )
        plan.delete()
        return success_response("Subscription plan deleted successfully.", None, status.HTTP_204_NO_CONTENT)


class UserSubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSubscription.objects.filter(user=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        subscription = _get_current_subscription(request.user)
        if not subscription:
            subscription = UserSubscription.objects.filter(user=request.user).order_by('-created_at').first()
            if not subscription:
                subscription = UserSubscription.objects.create(user=request.user, status='canceled', plan=None)

        serializer = self.get_serializer(subscription)
        return success_response("Subscription retrieved successfully.", serializer.data)

    @action(detail=False, methods=['get'])
    def usage(self, request):
        subscription = _get_current_subscription(request.user)
        if not subscription:
            subscription = UserSubscription.objects.filter(user=request.user).order_by('-created_at').first()

        if not subscription:
            usage_data = {
                'has_subscription': False,
                'plan_name': 'free',
                'plan_display_name': 'Free',
                'posts_used': 0,
                'posts_limit': getattr(settings, 'FREE_TIER_POSTS', 1),
                'remaining_posts': getattr(settings, 'FREE_TIER_POSTS', 1),
                'can_post': True,
                'has_credits': False,
                'credit_count': 0,
            }
            return success_response("Usage retrieved successfully.", SubscriptionUsageSerializer(usage_data).data)

        subscription.reset_monthly_usage()
        usage_data = {
            'has_subscription': subscription.plan is not None and subscription.status in ACTIVE_SUBSCRIPTION_STATUSES,
            'plan_name': subscription.plan.name if subscription.plan else 'free',
            'plan_display_name': subscription.plan.display_name if subscription.plan else 'Free',
            'posts_used': subscription.posts_used_this_month,
            'posts_limit': subscription.plan.posts_per_month if subscription.plan else getattr(settings, 'FREE_TIER_POSTS', 1),
            'remaining_posts': subscription.get_remaining_posts(),
            'can_post': subscription.can_post(),
            'has_credits': False,
            'credit_count': 0,
        }
        return success_response("Usage retrieved successfully.", SubscriptionUsageSerializer(usage_data).data)

    @action(detail=False, methods=['post'])
    def create_subscription_with_payment_method(self, request):
        """Create Stripe subscription directly from payment method."""
        if not STRIPE_AVAILABLE or not stripe.api_key:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)

        plan_id = request.data.get('plan_id')
        payment_method_id = request.data.get('payment_method_id')

        if not plan_id:
            return error_response("plan_id is required.", status.HTTP_400_BAD_REQUEST)
        if not payment_method_id:
            return error_response("payment_method_id is required.", status.HTTP_400_BAD_REQUEST)

        try:
            plan = SubscriptionPlan.objects.get(id=int(plan_id), is_active=True)
        except Exception:
            return error_response("Invalid plan selected.", status.HTTP_400_BAD_REQUEST)

        if not plan.stripe_price_id:
            return error_response("Plan is not configured with a Stripe price ID.")

        existing = _get_current_subscription(request.user)
        if existing and existing.stripe_subscription_id and not existing.cancel_at_period_end:
            return error_response(
                "You already have an active subscription. Cancel it first or use admin plan change flow.",
                status.HTTP_409_CONFLICT,
            )

        try:
            with transaction.atomic():
                customer_id = _get_or_create_customer(request.user)

                stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)
                stripe.Customer.modify(
                    customer_id,
                    invoice_settings={'default_payment_method': payment_method_id},
                )

                stripe_subscription = stripe.Subscription.create(
                    customer=customer_id,
                    items=[{'price': plan.stripe_price_id}],
                    default_payment_method=payment_method_id,
                    payment_behavior='error_if_incomplete',
                    metadata={'user_id': str(request.user.id), 'plan_id': str(plan.id)},
                    expand=['latest_invoice.payment_intent'],
                )

                local_subscription = _upsert_subscription_from_stripe(request.user, stripe_subscription, fallback_plan=plan)

                latest_invoice = stripe_subscription.get('latest_invoice') or {}
                payment_intent = latest_invoice.get('payment_intent')

                # Stripe may return only IDs in some API responses; fetch concrete objects when needed.
                if isinstance(latest_invoice, str):
                    try:
                        latest_invoice = stripe.Invoice.retrieve(
                            latest_invoice,
                            expand=['payment_intent'],
                        )
                        payment_intent = latest_invoice.get('payment_intent')
                    except Exception:
                        latest_invoice = {}

                if isinstance(payment_intent, str):
                    try:
                        payment_intent = stripe.PaymentIntent.retrieve(payment_intent)
                    except Exception:
                        payment_intent = {}

                payment_status = (payment_intent or {}).get('status') or (
                    'succeeded' if stripe_subscription.get('status') in {'active', 'trialing'} else 'processing'
                )
                client_secret = (payment_intent or {}).get('client_secret')
                requires_action = (
                    payment_status in {'requires_action', 'requires_payment_method', 'requires_confirmation'}
                    and bool(client_secret)
                )

                # Guardrail: we expect immediate activation with error_if_incomplete.
                if stripe_subscription.get('status') not in {'active', 'trialing'} and payment_status != 'succeeded':
                    return error_response(
                        "Initial payment is not completed. Subscription was not activated.",
                        status.HTTP_402_PAYMENT_REQUIRED,
                    )

                resp = success_response("Subscription created successfully.", {
                    'subscription_id': local_subscription.id,
                    'stripe_subscription_id': stripe_subscription.get('id'),
                    'client_secret': client_secret,
                    'payment_status': payment_status,
                    'requires_action': requires_action,
                })
                
                # Notify admins about new subscription
                notify_admins(request.user, 'admin_new_subscription')
                
                return resp
        except stripe.error.StripeError as exc:
            logger.error("Stripe error creating subscription: %s", str(exc), exc_info=True)
            return error_response(f"Payment error: {str(exc)}")
        except Exception as exc:
            logger.error("Error creating subscription: %s", str(exc), exc_info=True)
            return error_response(f"Failed to create subscription: {str(exc)}")

    @action(detail=False, methods=['post'])
    def cancel_subscription(self, request):
        """Cancel a subscription immediately or at period end."""
        if not STRIPE_AVAILABLE or not stripe.api_key:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)

        immediate = bool(request.data.get('immediate', False))
        subscription = _get_current_subscription(request.user)
        if not subscription or not subscription.stripe_subscription_id:
            return error_response("No active subscription found.", status.HTTP_404_NOT_FOUND)

        try:
            if immediate:
                stripe.Subscription.delete(subscription.stripe_subscription_id)
                subscription.status = 'canceled'
                subscription.cancel_at_period_end = True
                subscription.current_period_end = timezone.now()
            else:
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True,
                )
                subscription.cancel_at_period_end = True

            subscription.save(update_fields=['status', 'cancel_at_period_end', 'current_period_end', 'updated_at'])

            message = "Subscription canceled immediately." if immediate else "Subscription will be canceled at period end."
            return success_response(message)
        except stripe.error.StripeError as exc:
            logger.error("Stripe error canceling subscription: %s", str(exc), exc_info=True)
            return error_response(f"Failed to cancel subscription: {str(exc)}")

    @action(detail=False, methods=['post'])
    def resume_subscription(self, request):
        if not STRIPE_AVAILABLE or not stripe.api_key:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)

        subscription = UserSubscription.objects.filter(
            user=request.user,
            status__in=ACTIVE_SUBSCRIPTION_STATUSES,
            cancel_at_period_end=True,
        ).order_by('-created_at').first()

        if not subscription or not subscription.stripe_subscription_id:
            return error_response("No canceling subscription found.", status.HTTP_404_NOT_FOUND)

        try:
            stripe.Subscription.modify(subscription.stripe_subscription_id, cancel_at_period_end=False)
            subscription.cancel_at_period_end = False
            subscription.save(update_fields=['cancel_at_period_end', 'updated_at'])
            return success_response("Subscription resumed successfully.")
        except stripe.error.StripeError as exc:
            logger.error("Stripe error resuming subscription: %s", str(exc), exc_info=True)
            return error_response(f"Failed to resume subscription: {str(exc)}")


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(
            user=self.request.user,
            payment_type='subscription',
        ).order_by('-created_at')


class PostCreditViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PostCreditSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PostCredit.objects.none()
