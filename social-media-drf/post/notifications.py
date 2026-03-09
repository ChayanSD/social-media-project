from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

def notify_admins(sender, notification_type, post=None, comment=None, community=None):
    """
    Sends a notification to all users with the 'admin' role.
    """
    admins = User.objects.filter(role='admin')
    
    notifications = [
        Notification(
            recipient=admin,
            sender=sender,
            notification_type=notification_type,
            post=post,
            comment=comment,
            community=community
        ) for admin in admins
    ]
    
    if notifications:
        Notification.objects.bulk_create(notifications)
