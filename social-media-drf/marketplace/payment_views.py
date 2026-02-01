# payment_views.py
try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    stripe = None
    STRIPE_AVAILABLE = False
    
import logging
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from accounts.permissions import IsAdmin
from .models import SubscriptionPlan, UserSubscription, Payment, PostCredit
from .payment_serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    PaymentSerializer,
    PostCreditSerializer,
    SubscriptionUsageSerializer
)
from .views import success_response, error_response

logger = logging.getLogger(__name__)

# Initialize Stripe
if STRIPE_AVAILABLE:
    stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None)
    if not stripe.api_key:
        logger.warning("Stripe secret key not found in settings")


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for subscription plans - Admin can CRUD, users can only read active plans"""
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Admin can do everything, regular users can only read"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Admin sees all plans, users see only active plans"""
        if hasattr(self.request.user, 'role') and self.request.user.role == 'admin':
            return SubscriptionPlan.objects.all().order_by('price')
        return SubscriptionPlan.objects.filter(is_active=True).order_by('price')
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return success_response("Subscription plans retrieved successfully.", serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving subscription plans: {str(e)}", exc_info=True)
            return error_response(f"Failed to retrieve plans: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request, *args, **kwargs):
        """Create a new subscription plan with Stripe integration"""
        if not STRIPE_AVAILABLE:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            plan_data = serializer.validated_data
            price = plan_data.get('price', 0)
            
            # Create Stripe product and price if plan is not free
            stripe_product_id = None
            stripe_price_id = None
            
            if price > 0:
                try:
                    # Create Stripe product
                    stripe_product = stripe.Product.create(
                        name=plan_data.get('display_name'),
                        description=f"{plan_data.get('display_name')} subscription plan",
                        metadata={'plan_name': plan_data.get('name')}
                    )
                    stripe_product_id = stripe_product.id
                    
                    # Create Stripe price
                    stripe_price = stripe.Price.create(
                        product=stripe_product_id,
                        unit_amount=int(float(price) * 100),  # Convert to cents
                        currency='usd',
                        recurring={'interval': 'month'},
                        metadata={'plan_name': plan_data.get('name')}
                    )
                    stripe_price_id = stripe_price.id
                except stripe.error.StripeError as e:
                    logger.error(f"Stripe error creating plan: {str(e)}")
                    return error_response(f"Failed to create Stripe product/price: {str(e)}", status.HTTP_400_BAD_REQUEST)
            
            # If this plan is marked as recommended, unmark other recommended plans
            if plan_data.get('is_recommended', False):
                SubscriptionPlan.objects.filter(is_recommended=True).update(is_recommended=False)
            
            # Create plan with Stripe IDs
            plan = SubscriptionPlan.objects.create(
                **plan_data,
                stripe_product_id=stripe_product_id,
                stripe_price_id=stripe_price_id
            )
            
            serializer = self.get_serializer(plan)
            return success_response("Subscription plan created successfully.", serializer.data, status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating subscription plan: {str(e)}", exc_info=True)
            return error_response(f"Failed to create plan: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        """Update subscription plan with Stripe integration"""
        if not STRIPE_AVAILABLE:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            
            plan_data = serializer.validated_data
            price = plan_data.get('price', instance.price)
            
            # Update Stripe product/price if price changed and plan is not free
            if price > 0:
                try:
                    # Update or create Stripe product
                    if instance.stripe_product_id:
                        stripe.Product.modify(
                            instance.stripe_product_id,
                            name=plan_data.get('display_name', instance.display_name),
                            description=f"{plan_data.get('display_name', instance.display_name)} subscription plan"
                        )
                    else:
                        stripe_product = stripe.Product.create(
                            name=plan_data.get('display_name', instance.display_name),
                            description=f"{plan_data.get('display_name', instance.display_name)} subscription plan",
                            metadata={'plan_name': plan_data.get('name', instance.name)}
                        )
                        plan_data['stripe_product_id'] = stripe_product.id
                    
                    # If price changed, create new Stripe price and archive old one
                    if price != instance.price and instance.stripe_price_id:
                        # Archive old price
                        stripe.Price.modify(instance.stripe_price_id, active=False)
                        
                    # Create new price
                    stripe_price = stripe.Price.create(
                        product=plan_data.get('stripe_product_id', instance.stripe_product_id),
                        unit_amount=int(float(price) * 100),
                        currency='usd',
                        recurring={'interval': 'month'},
                        metadata={'plan_name': plan_data.get('name', instance.name)}
                    )
                    plan_data['stripe_price_id'] = stripe_price.id
                except stripe.error.StripeError as e:
                    logger.error(f"Stripe error updating plan: {str(e)}")
                    return error_response(f"Failed to update Stripe product/price: {str(e)}", status.HTTP_400_BAD_REQUEST)
            
            # If this plan is marked as recommended, unmark other recommended plans
            if plan_data.get('is_recommended', False) and not instance.is_recommended:
                SubscriptionPlan.objects.filter(is_recommended=True).exclude(id=instance.id).update(is_recommended=False)
            
            serializer.save()
            return success_response("Subscription plan updated successfully.", serializer.data)
        except Exception as e:
            logger.error(f"Error updating subscription plan: {str(e)}", exc_info=True)
            return error_response(f"Failed to update plan: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update subscription plan"""
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle the active status of a subscription plan"""
        try:
            instance = self.get_object()
            instance.is_active = not instance.is_active
            instance.save()
            
            status_text = "activated" if instance.is_active else "deactivated"
            serializer = self.get_serializer(instance)
            return success_response(f"Subscription plan {status_text} successfully.", serializer.data)
        except Exception as e:
            logger.error(f"Error toggling subscription plan status: {str(e)}", exc_info=True)
            return error_response(f"Failed to toggle plan status: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """Delete subscription plan (hard delete if no active subscriptions)"""
        try:
            instance = self.get_object()
            
            # Check if plan has active subscriptions
            active_subscriptions = UserSubscription.objects.filter(
                plan=instance,
                status='active'
            )
            
            if active_subscriptions.exists():
                count = active_subscriptions.count()
                return error_response(
                    f"Cannot delete plan. {count} user(s) have active subscriptions. "
                    f"Please deactivate the plan instead to prevent new signups, or wait until subscription periods end.",
                    status.HTTP_400_BAD_REQUEST
                )
            
            # Archive products/prices in Stripe if possible
            if STRIPE_AVAILABLE:
                try:
                    if instance.stripe_price_id:
                        stripe.Price.modify(instance.stripe_price_id, active=False)
                    if instance.stripe_product_id:
                        stripe.Product.modify(instance.stripe_product_id, active=False)
                except Exception as e:
                    logger.warning(f"Failed to archive Stripe product/price for plan {instance.id}: {str(e)}")

            # Hard delete
            instance.delete()
            
            return success_response("Subscription plan deleted successfully from database.", None, status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting subscription plan: {str(e)}", exc_info=True)
            return error_response(f"Failed to delete plan: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserSubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for user subscriptions"""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserSubscription.objects.filter(user=self.request.user)
    
    def get_object(self):
        # Get the most recent active subscription or the latest created one
        subscription = UserSubscription.objects.filter(user=self.request.user).order_by('-created_at').first()
        if not subscription:
            subscription = UserSubscription.objects.create(
                user=self.request.user,
                plan=None,
                status='active'
            )
        return subscription
    
    @action(detail=False, methods=['get'])
    def usage(self, request):
        """Get current subscription usage"""
        try:
            # Get the most recent active subscription
            subscription = UserSubscription.objects.filter(
                user=request.user, 
                status='active'
            ).order_by('-created_at').first()
            
            if not subscription:
                # If no active, get latest overall or create free one
                subscription = UserSubscription.objects.filter(user=request.user).order_by('-created_at').first()
                if not subscription:
                    subscription = UserSubscription.objects.create(
                        user=request.user,
                        plan=None,
                        status='active'
                    )
            subscription.reset_monthly_usage()
            
            # Check for available credits
            credits = PostCredit.objects.filter(user=request.user)
            # Filter credits that haven't expired (if expires_at is set)
            valid_credits = [c for c in credits if (c.expires_at is None or c.expires_at > timezone.now()) and c.has_credits()]
            total_credits = sum(c.amount - c.used for c in valid_credits)
            
            usage_data = {
                'has_subscription': subscription.plan is not None,
                'plan_name': subscription.plan.name if subscription.plan else 'free',  # Use plan.name (slug) for matching
                'plan_display_name': subscription.plan.display_name if subscription.plan else 'Free',  # Keep display_name for UI
                'posts_used': subscription.posts_used_this_month,
                'posts_limit': subscription.plan.posts_per_month if subscription.plan else 1,
                'remaining_posts': subscription.get_remaining_posts(),
                'can_post': subscription.can_post() or total_credits > 0,
                'has_credits': total_credits > 0,
                'credit_count': total_credits
            }
            
            serializer = SubscriptionUsageSerializer(usage_data)
            return success_response("Usage retrieved successfully.", serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving subscription usage: {str(e)}", exc_info=True)
            return error_response(f"Failed to retrieve usage: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def create_checkout_session(self, request):
        """Create Stripe checkout session for subscription"""
        if not STRIPE_AVAILABLE:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return error_response("plan_id is required.")
        
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return error_response("Invalid plan selected.")
        
        if not plan.stripe_price_id:
            return error_response("Plan is not configured for payments.")
        
        try:
            # Get or create Stripe customer
            latest_sub = UserSubscription.objects.filter(user=request.user).order_by('-created_at').first()
            customer_id = latest_sub.stripe_customer_id if latest_sub else None
            
            if not customer_id:
                # Create Stripe customer
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=request.user.username,
                    metadata={'user_id': request.user.id}
                )
                customer_id = customer.id
            
            # Ensure the customer_id is saved if we just created it or if it's new
            if not latest_sub:
                latest_sub = UserSubscription.objects.create(
                    user=request.user,
                    plan=None,
                    status='active',
                    stripe_customer_id=customer_id
                )
            elif not latest_sub.stripe_customer_id:
                latest_sub.stripe_customer_id = customer_id
                latest_sub.save()
            
            # Create checkout session
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': plan.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=request.data.get('success_url', 'http://localhost:3000/marketplace/promote?success=true'),
                cancel_url=request.data.get('cancel_url', 'http://localhost:3000/marketplace/promote?canceled=true'),
                metadata={
                    'user_id': request.user.id,
                    'plan_id': plan.id,
                    'type': 'subscription'
                }
            )
            
            return success_response("Checkout session created.", {
                'session_id': checkout_session.id,
                'url': checkout_session.url
            })
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return error_response(f"Payment error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            return error_response(f"Failed to create checkout session: {str(e)}")
    
    @action(detail=False, methods=['post'])
    def create_post_payment(self, request):
        """Create Stripe checkout session for one-time post payment"""
        if not STRIPE_AVAILABLE:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)
        from django.conf import settings
        
        try:
            latest_sub = UserSubscription.objects.filter(user=request.user).order_by('-created_at').first()
            customer_id = latest_sub.stripe_customer_id if latest_sub else None
            
            if not customer_id:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=request.user.username,
                    metadata={'user_id': request.user.id}
                )
                customer_id = customer.id
            
            if not latest_sub:
                subscription = UserSubscription.objects.create(
                    user=request.user,
                    plan=None,
                    status='active',
                    stripe_customer_id=customer_id
                )
            else:
                subscription = latest_sub
                if not subscription.stripe_customer_id:
                    subscription.stripe_customer_id = customer_id
                    subscription.save()
            
            # Create checkout session for one-time payment
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'Promotion Post',
                            'description': 'One-time payment for a single promotion post'
                        },
                        'unit_amount': int(settings.PAY_PER_POST_PRICE * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=request.data.get('success_url', 'http://localhost:3000/marketplace/promote?success=true'),
                cancel_url=request.data.get('cancel_url', 'http://localhost:3000/marketplace/promote?canceled=true'),
                metadata={
                    'user_id': request.user.id,
                    'type': 'one_time_post',
                    'post_count': '1'
                }
            )
            
            return success_response("Checkout session created.", {
                'session_id': checkout_session.id,
                'url': checkout_session.url
            })
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return error_response(f"Payment error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            return error_response(f"Failed to create checkout session: {str(e)}")
    
    @action(detail=False, methods=['post'])
    def cancel_subscription(self, request):
        """Cancel subscription at period end"""
        if not STRIPE_AVAILABLE:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            # Get the most recent active subscription
            subscription = UserSubscription.objects.filter(
                user=request.user, 
                status='active'
            ).order_by('-created_at').first()
            
            if not subscription or not subscription.stripe_subscription_id:
                return error_response("No active subscription found.")
        except Exception as e:
            return error_response(f"Error finding subscription: {str(e)}")
        
        try:
            # Cancel at period end
            stripe_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )
            
            subscription.cancel_at_period_end = True
            subscription.save()
            
            return success_response("Subscription will be canceled at the end of the billing period.")
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return error_response(f"Failed to cancel subscription: {str(e)}")
    
    @action(detail=False, methods=['post'])
    def create_subscription_with_payment_method(self, request):
        """Create subscription using payment method (embedded payment)"""
        if not STRIPE_AVAILABLE:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)
        # Log full request details for debugging
        logger.info(f"Request received - Method: {request.method}, Content-Type: {request.content_type}")
        logger.info(f"Request data: {request.data}")
        logger.info(f"Request user: {request.user.id if request.user.is_authenticated else 'Not authenticated'}")
        
        try:
            plan_id = request.data.get('plan_id')
            payment_method_id = request.data.get('payment_method_id')
            
            logger.info(f"Extracted - plan_id: {plan_id} (type: {type(plan_id)}), payment_method_id: {payment_method_id}")
            
            if plan_id is None:
                logger.error("plan_id is missing from request.data")
                return error_response("plan_id is required.", status.HTTP_400_BAD_REQUEST)
            
            # Convert to int if it's a string
            try:
                plan_id = int(plan_id)
            except (ValueError, TypeError) as e:
                logger.error(f"plan_id is not a valid integer: {plan_id}, error: {str(e)}")
                return error_response(f"plan_id must be a valid integer. Received: {plan_id}", status.HTTP_400_BAD_REQUEST)
            
            if not payment_method_id:
                logger.error("payment_method_id is missing from request.data")
                return error_response("payment_method_id is required.", status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error parsing request data: {str(e)}", exc_info=True)
            return error_response(f"Invalid request data: {str(e)}", status.HTTP_400_BAD_REQUEST)
        
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return error_response("Invalid plan selected.")
        
        if not plan.stripe_price_id:
            return error_response("Plan is not configured for payments.")
        
        try:
            # Get or create Stripe customer from any existing subscription
            latest_sub = UserSubscription.objects.filter(user=request.user).order_by('-created_at').first()
            customer_id = latest_sub.stripe_customer_id if latest_sub else None
            
            if not customer_id:
                # Create Stripe customer
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=request.user.username,
                    metadata={'user_id': request.user.id}
                )
                customer_id = customer.id
            
            if not latest_sub:
                subscription = UserSubscription.objects.create(
                    user=request.user,
                    plan=None,
                    status='active',
                    stripe_customer_id=customer_id
                )
            else:
                subscription = latest_sub
                if not subscription.stripe_customer_id:
                    subscription.stripe_customer_id = customer_id
                    subscription.save()
            
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id,
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={'default_payment_method': payment_method_id},
            )
            
            # Create subscription with payment method
            stripe_subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': plan.stripe_price_id}],
                default_payment_method=payment_method_id,
                metadata={
                    'user_id': request.user.id,
                    'plan_id': plan.id,
                },
                expand=['latest_invoice'],
            )
            
            # Update user subscription
            try:
                # Safely get timestamp values from Stripe subscription
                period_start_raw = getattr(stripe_subscription, 'current_period_start', None)
                period_end_raw = getattr(stripe_subscription, 'current_period_end', None)
                
                # Log the actual values for debugging
                logger.info(f"Stripe subscription timestamps - current_period_start: {period_start_raw} (type: {type(period_start_raw)}), current_period_end: {period_end_raw} (type: {type(period_end_raw)})")
                
                # For history: If the plan is different or there's a new Stripe subscription, 
                # we should create a NEW UserSubscription record.
                # However, if we just updated an existing stripe subscription, we might update the record.
                # To keep it simple and historical, if the stripe_subscription_id matches an existing record for THIS user, update it.
                # Otherwise, create a new one.
                
                subscription = UserSubscription.objects.filter(
                    user=request.user, 
                    stripe_subscription_id=stripe_subscription.id
                ).first()
                
                if not subscription:
                    # Mark existing active subscriptions as 'completed' if any
                    UserSubscription.objects.filter(user=request.user, status='active').update(status='completed')
                    
                    subscription = UserSubscription.objects.create(
                        user=request.user,
                        plan=plan,
                        status='active',
                        stripe_subscription_id=stripe_subscription.id,
                        stripe_customer_id=customer_id
                    )
                else:
                    subscription.plan = plan
                    subscription.status = 'active'
                
                # Check if plan changed and reset usage
                # (Note: we use a new record so usage is naturally 0)
                
                subscription.save()
                logger.info(f"Saved subscription record - ID: {subscription.id}")
                
                # Now convert and save timestamps separately
                period_start = None
                period_end = None
                
                # Convert timestamps if available
                if period_start_raw:
                    try:
                        if isinstance(period_start_raw, (int, float)):
                            period_start = timezone.datetime.fromtimestamp(
                                float(period_start_raw), tz=timezone.utc
                            )
                            logger.info(f"Converted current_period_start: {period_start}")
                        else:
                            logger.warning(f"Unexpected type for current_period_start: {type(period_start_raw)}")
                    except (ValueError, TypeError, AttributeError) as e:
                        logger.error(f"Error converting current_period_start: {str(e)}", exc_info=True)
                        period_start = None
                
                if period_end_raw:
                    try:
                        if isinstance(period_end_raw, (int, float)):
                            period_end = timezone.datetime.fromtimestamp(
                                float(period_end_raw), tz=timezone.utc
                            )
                            logger.info(f"Converted current_period_end: {period_end}")
                        else:
                            logger.warning(f"Unexpected type for current_period_end: {type(period_end_raw)}")
                    except (ValueError, TypeError, AttributeError) as e:
                        logger.error(f"Error converting current_period_end: {str(e)}", exc_info=True)
                        period_end = None
                
                # Update timestamp fields separately by refreshing and updating
                subscription.refresh_from_db()
                subscription.current_period_start = period_start
                subscription.current_period_end = period_end
                subscription.save(update_fields=['current_period_start', 'current_period_end'])
                logger.info(f"Subscription saved successfully - ID: {subscription.id}, plan: {plan.display_name}, period_start: {period_start}, period_end: {period_end}")
                
            except DjangoValidationError as e:
                error_msg = f"Validation error: {e.message_dict if hasattr(e, 'message_dict') else str(e)}"
                logger.error(f"Validation error saving subscription: {error_msg}", exc_info=True)
                # Try to cancel the Stripe subscription if database save fails
                try:
                    stripe.Subscription.delete(stripe_subscription.id)
                    logger.info(f"Cancelled Stripe subscription {stripe_subscription.id} due to validation error")
                except Exception as cancel_error:
                    logger.error(f"Failed to cancel Stripe subscription: {str(cancel_error)}")
                raise Exception(f"Failed to save subscription: {error_msg}")
            except Exception as e:
                error_msg = str(e)
                error_type = type(e).__name__
                logger.error(f"Error saving subscription ({error_type}): {error_msg}", exc_info=True)
                # Try to cancel the Stripe subscription if database save fails
                try:
                    stripe.Subscription.delete(stripe_subscription.id)
                    logger.info(f"Cancelled Stripe subscription {stripe_subscription.id} due to database error")
                except Exception as cancel_error:
                    logger.error(f"Failed to cancel Stripe subscription: {str(cancel_error)}")
                raise Exception(f"Failed to save subscription ({error_type}): {error_msg}")
            
            # Get payment intent status from invoice
            # Note: Stripe API changed - payment_intent is no longer directly on Invoice
            # We need to check the invoice's payment_intents collection or status
            latest_invoice = stripe_subscription.latest_invoice
            payment_status = 'succeeded'
            client_secret = None
            requires_action = False
            
            if latest_invoice:
                # Check invoice status
                if isinstance(latest_invoice, dict):
                    invoice_status = latest_invoice.get('status', 'paid')
                    # Try to get payment intent from payment_intents collection (new API)
                    payment_intents = latest_invoice.get('payment_intents', [])
                    if payment_intents:
                        # Get the first payment intent
                        payment_intent_data = payment_intents[0] if isinstance(payment_intents, list) else payment_intents
                        if isinstance(payment_intent_data, dict):
                            payment_status = payment_intent_data.get('status', 'succeeded')
                            client_secret = payment_intent_data.get('client_secret')
                        else:
                            payment_status = getattr(payment_intent_data, 'status', 'succeeded')
                            client_secret = getattr(payment_intent_data, 'client_secret', None)
                    elif invoice_status == 'open' or invoice_status == 'draft':
                        payment_status = 'processing'
                else:
                    # Invoice object
                    invoice_status = getattr(latest_invoice, 'status', 'paid')
                    # Try to access payment_intents collection
                    try:
                        payment_intents = getattr(latest_invoice, 'payment_intents', None)
                        if payment_intents:
                            # If it's a list, get the first one
                            if isinstance(payment_intents, list) and len(payment_intents) > 0:
                                payment_intent_obj = payment_intents[0]
                                payment_status = getattr(payment_intent_obj, 'status', 'succeeded')
                                client_secret = getattr(payment_intent_obj, 'client_secret', None)
                            elif hasattr(payment_intents, 'status'):
                                payment_status = payment_intents.status
                                client_secret = getattr(payment_intents, 'client_secret', None)
                    except AttributeError:
                        pass
                    
                    # Fallback: check invoice status
                    if invoice_status == 'open' or invoice_status == 'draft':
                        payment_status = 'processing'
                
                requires_action = payment_status == 'requires_action' or payment_status == 'requires_payment_method'
            
            # Create payment record immediately if succeeded
            if payment_status == 'succeeded':
                amount = 0
                invoice_id = None
                payment_intent_id = None
                
                try:
                    if latest_invoice:
                        if isinstance(latest_invoice, str):
                            inv = stripe.Invoice.retrieve(latest_invoice)
                            amount = inv.amount_paid / 100
                            invoice_id = inv.id
                            payment_intent_id = inv.payment_intent
                        else:
                            amount = latest_invoice.get('amount_paid', 0) / 100
                            invoice_id = latest_invoice.get('id')
                            payment_intent_id = latest_invoice.get('payment_intent')
                    else:
                        amount = float(plan.price)
                except Exception as e:
                    logger.error(f"Error retrieving invoice details for payment record: {str(e)}")
                    amount = float(plan.price)
                
                # Check if payment already exists to avoid duplicates
                existing_payment = Payment.objects.filter(
                    stripe_payment_intent_id=payment_intent_id
                ).filter(stripe_payment_intent_id__isnull=False).first()
                
                if not existing_payment and invoice_id:
                     existing_payment = Payment.objects.filter(
                        metadata__invoice_id=invoice_id
                    ).first()

                if not existing_payment:
                    Payment.objects.create(
                        user=request.user,
                        subscription=subscription,
                        payment_type='subscription',
                        amount=amount,
                        currency='usd',
                        status='succeeded',
                        stripe_payment_intent_id=payment_intent_id,
                        description=f'Subscription to {plan.display_name}',
                        metadata={
                            'subscription_id': stripe_subscription.id,
                            'invoice_id': invoice_id,
                            'created_from': 'view'
                        }
                    )
                    logger.info(f"Payment record created from view for subscription {subscription.id}")

            return success_response("Subscription created successfully.", {
                'subscription_id': subscription.id,
                'stripe_subscription_id': stripe_subscription.id,
                'client_secret': client_secret,
                'payment_status': payment_status,
                'requires_action': requires_action,
            })
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return error_response(f"Payment error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}", exc_info=True)
            return error_response(f"Failed to create subscription: {str(e)}")
    
    @action(detail=False, methods=['post'])
    def create_post_payment_with_payment_method(self, request):
        """Create one-time post payment using payment method (embedded payment)"""
        if not STRIPE_AVAILABLE:
            return error_response("Payment gateway is not currently available.", status.HTTP_503_SERVICE_UNAVAILABLE)
        from django.conf import settings
        
        payment_method_id = request.data.get('payment_method_id')
        if not payment_method_id:
            return error_response("payment_method_id is required.")
        
        try:
            # Get or create Stripe customer from any existing subscription
            latest_sub = UserSubscription.objects.filter(user=request.user).order_by('-created_at').first()
            customer_id = latest_sub.stripe_customer_id if latest_sub else None
            
            if not customer_id:
                # Create Stripe customer
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=request.user.username,
                    metadata={'user_id': request.user.id}
                )
                customer_id = customer.id
            
            if not latest_sub:
                subscription = UserSubscription.objects.create(
                    user=request.user,
                    plan=None,
                    status='active',
                    stripe_customer_id=customer_id
                )
            else:
                subscription = latest_sub
                if not subscription.stripe_customer_id:
                    subscription.stripe_customer_id = customer_id
                    subscription.save()
            
            # Create payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=int(settings.PAY_PER_POST_PRICE * 100),  # Convert to cents
                currency='usd',
                customer=customer_id,
                payment_method=payment_method_id,
                confirm=True,
                return_url=f"{request.data.get('return_url', 'http://localhost:3000/marketplace/promote')}?success=true",
                metadata={
                    'user_id': request.user.id,
                    'type': 'one_time_post',
                    'post_count': '1',
                },
            )
            
            # Create payment record immediately if succeeded
            if payment_intent.status == 'succeeded':
                # Check if payment already exists
                existing_payment = Payment.objects.filter(
                    stripe_payment_intent_id=payment_intent.id
                ).first()
                
                if not existing_payment:
                    payment = Payment.objects.create(
                        user=request.user,
                        payment_type='one_time',
                        amount=settings.PAY_PER_POST_PRICE,
                        currency='usd',
                        status='succeeded',
                        stripe_payment_intent_id=payment_intent.id,
                        description='One-time payment for a single promotion post',
                        metadata={
                            'payment_intent_id': payment_intent.id,
                            'post_count': '1',
                            'created_from': 'view'
                        }
                    )
                    
                    # Create post credits
                    post_count = 1
                    PostCredit.objects.create(
                        user=request.user,
                        amount=post_count,
                        payment=payment
                    )
                    logger.info(f"Payment and credit created from view for one-time post payment, user {request.user.id}")

            # Payment will be created via webhook, but we can return status
            return success_response("Payment processed successfully.", {
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'status': payment_intent.status,
                'requires_action': payment_intent.status == 'requires_action',
            })
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return error_response(f"Payment error: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing payment: {str(e)}", exc_info=True)
            return error_response(f"Failed to process payment: {str(e)}")


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for payment history"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')


class PostCreditViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for post credits"""
    serializer_class = PostCreditSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PostCredit.objects.filter(user=self.request.user).order_by('-created_at')

