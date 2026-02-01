from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(Product)
admin.site.register(SubscriptionPlan)


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'posts_used_this_month', 'get_posts_limit', 'current_period_start', 'current_period_end', 'created_at')
    list_filter = ('status', 'plan', 'cancel_at_period_end', 'created_at')
    search_fields = ('user__username', 'user__email', 'stripe_subscription_id', 'stripe_customer_id')
    readonly_fields = ('stripe_subscription_id', 'stripe_customer_id', 'created_at', 'updated_at', 'last_reset_date')
    list_per_page = 20
    date_hierarchy = 'created_at'
    
    def get_posts_limit(self, obj):
        """Display posts limit from plan"""
        if obj.plan:
            return f"{obj.plan.posts_per_month} posts/month" if obj.plan.posts_per_month > 0 else "Unlimited"
        return "1 post/month (Free)"
    get_posts_limit.short_description = 'Posts Limit'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'plan', 'status')
        }),
        ('Stripe Information', {
            'fields': ('stripe_subscription_id', 'stripe_customer_id')
        }),
        ('Subscription Period', {
            'fields': ('current_period_start', 'current_period_end', 'cancel_at_period_end')
        }),
        ('Usage Statistics', {
            'fields': ('posts_used_this_month', 'last_reset_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


admin.site.register(Payment)
admin.site.register(PostCredit)