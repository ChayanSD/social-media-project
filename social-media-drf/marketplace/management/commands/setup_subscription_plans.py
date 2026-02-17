from django.core.management.base import BaseCommand

from marketplace.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Create or update default Starter/Growth/Platinum monthly and yearly plans'

    def handle(self, *args, **options):
        plans = [
            {
                'name': 'starter-monthly',
                'display_name': 'Starter Plan - Monthly',
                'price': 14.99,
                'billing_cycle': 'month',
                'billing_interval_count': 1,
                'posts_per_month': 5,
                'features': ['5 posts/month', 'Auto renewal every month'],
            },
            {
                'name': 'starter-yearly',
                'display_name': 'Starter Plan - Yearly',
                'price': 119.88,
                'billing_cycle': 'year',
                'billing_interval_count': 1,
                'posts_per_month': 5,
                'features': ['5 posts/month', 'Billed yearly ($9.99/mo equivalent)'],
            },
            {
                'name': 'growth-monthly',
                'display_name': 'Growth Plan - Monthly',
                'price': 19.99,
                'billing_cycle': 'month',
                'billing_interval_count': 1,
                'posts_per_month': 15,
                'features': ['15 posts/month', 'Auto renewal every month'],
            },
            {
                'name': 'growth-yearly',
                'display_name': 'Growth Plan - Yearly',
                'price': 179.88,
                'billing_cycle': 'year',
                'billing_interval_count': 1,
                'posts_per_month': 15,
                'features': ['15 posts/month', 'Billed yearly ($14.99/mo equivalent)'],
            },
            {
                'name': 'platinum-monthly',
                'display_name': 'Platinum Plan - Monthly',
                'price': 24.99,
                'billing_cycle': 'month',
                'billing_interval_count': 1,
                'posts_per_month': 0,
                'features': ['Unlimited posts', 'Auto renewal every month'],
            },
            {
                'name': 'platinum-yearly',
                'display_name': 'Platinum Plan - Yearly',
                'price': 239.88,
                'billing_cycle': 'year',
                'billing_interval_count': 1,
                'posts_per_month': 0,
                'features': ['Unlimited posts', 'Billed yearly ($19.99/mo equivalent)'],
            },
        ]

        for item in plans:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=item['name'],
                defaults=item,
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f"{action}: {plan.display_name}"))

        self.stdout.write(self.style.SUCCESS('Default subscription plans are ready.'))
