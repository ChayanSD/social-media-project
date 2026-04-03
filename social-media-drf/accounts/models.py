from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify
from django.conf import settings
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.core.files.storage import default_storage
from interest.models import SubCategory
class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
    ]
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    is_oauth_user = models.BooleanField(default=False)
    username_set = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return f"{self.username} ({self.role})"
    
class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    display_name = models.CharField(max_length=150, blank=True, null=True)
    about = models.TextField(blank=True, null=True)
    social_link = models.URLField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    cover_photo = models.ImageField(upload_to='covers/', blank=True, null=True)
    subcategories = models.ManyToManyField(
        SubCategory, 
        related_name="interested_users",
        blank=True  # Make it optional
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.display_name if self.display_name else self.user.username
# Automatically create profile when user is created
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile = Profile.objects.create(user=instance, display_name=instance.username)
        # Add default interest
        try:
            from interest.models import Category, SubCategory
            # Attempt to find 'General' or just pick the first available approved subcategory
            general_interest = SubCategory.objects.filter(name__iexact='General', is_approved=True).first()
            
            if not general_interest:
                # If 'General' doesn't exist, try to find any approved subcategory
                general_interest = SubCategory.objects.filter(is_approved=True).first()
            
            if not general_interest:
                # If literally NO subcategories exist, and admin hasn't set any, create one
                if instance.is_superuser: # Let superuser be creator
                    creator = instance
                else:
                    from django.contrib.auth import get_user_model
                    creator = get_user_model().objects.filter(is_superuser=True).first()
                
                cat, _ = Category.objects.get_or_create(name='General', defaults={'is_approved': True, 'created_by': creator})
                general_interest, _ = SubCategory.objects.get_or_create(
                    name='General', 
                    category=cat, 
                    defaults={'is_approved': True, 'created_by': creator}
                )

            if general_interest:
                profile.subcategories.add(general_interest)
        except Exception:
            pass

@receiver(post_delete, sender=Profile)
def delete_profile_images(sender, instance, **kwargs):
    """Delete avatar and cover photo from storage when Profile is deleted"""
    if instance.avatar:
        if default_storage.exists(instance.avatar.name):
            default_storage.delete(instance.avatar.name)
    if instance.cover_photo:
        if default_storage.exists(instance.cover_photo.name):
            default_storage.delete(instance.cover_photo.name)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


class Contact(models.Model):
    """Model to store contact form submissions"""
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    read_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='read_contacts'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Submission'
        verbose_name_plural = 'Contact Submissions'

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.subject}"