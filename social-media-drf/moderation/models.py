from django.db import models
from django.conf import settings
from django.utils import timezone


class UserModerationStatus(models.Model):
    """Track user moderation status and warning counts"""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="moderation_status",
    )
    warning_count = models.PositiveIntegerField(default=0)
    is_blocked = models.BooleanField(default=False)
    blocked_at = models.DateTimeField(null=True, blank=True)
    blocked_reason = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
            models.Index(fields=["is_blocked", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} - warnings: {self.warning_count}/5, blocked: {self.is_blocked}"

    def increment_warning(self, reason=None):
        """Increment warning count and block if threshold reached"""
        self.warning_count += 1
        self.save()

        if self.warning_count >= 5:
            self.is_blocked = True
            self.blocked_at = timezone.now()
            self.blocked_reason = reason
            self.save()

        return self

    def reset_warnings(self):
        """Reset warning count"""
        self.warning_count = 0
        self.is_blocked = False
        self.blocked_at = None
        self.blocked_reason = None
        self.save()
        return self

    def decrement_warnings(self, amount=1):
        """Decrease warning count by specified amount"""
        self.warning_count = max(0, self.warning_count - amount)
        if self.warning_count < 5:
            self.is_blocked = False
            self.blocked_at = None
            self.blocked_reason = None
        self.save()
        return self

    def unblock(self):
        """Unblock user but keep warning count"""
        self.is_blocked = False
        self.blocked_at = None
        self.blocked_reason = None
        self.save()
        return self


class ModerationEvent(models.Model):
    """Log all moderation events for auditability"""

    CONTENT_TYPES = [
        ("chat_message", "Chat Message"),
        ("post", "Post"),
        ("comment", "Comment"),
        ("marketplace_product", "Marketplace Product"),
        ("category_proposal", "Category Proposal"),
    ]

    VIOLATION_TYPES = [
        ("safety", "Safety Violation"),
        ("spam", "Spam"),
        ("unrelated", "Unrelated Category/Topic"),
    ]

    DECISION_TYPES = [
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("pending_review", "Pending Review"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="moderation_events",
    )
    content_type = models.CharField(max_length=30, choices=CONTENT_TYPES)
    content_id = models.PositiveIntegerField(null=True, blank=True)
    content_text = models.TextField(
        blank=True, null=True, help_text="Content that was moderated"
    )
    violation_type = models.CharField(
        max_length=30, choices=VIOLATION_TYPES, null=True, blank=True
    )
    decision = models.CharField(max_length=20, choices=DECISION_TYPES)
    rejection_reason = models.TextField(blank=True, null=True)
    warning_issued = models.BooleanField(default=False)
    auto_blocked = models.BooleanField(default=False)
    ai_model_used = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="OpenAI model used for moderation",
    )
    ai_flags = models.JSONField(
        default=dict, blank=True, help_text="AI moderation API flags"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["content_type", "-created_at"]),
            models.Index(fields=["decision", "-created_at"]),
            models.Index(fields=["violation_type", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.content_type} - {self.decision}"


class CategoryProposal(models.Model):
    """Track category/subcategory proposals pending review"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    PROPOSAL_TYPES = [
        ("category", "Category"),
        ("subcategory", "SubCategory"),
    ]

    proposer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="category_proposals",
    )
    proposal_type = models.CharField(max_length=20, choices=PROPOSAL_TYPES)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    parent_category = models.ForeignKey(
        "interest.Category",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subcategory_proposals",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    rejection_reason = models.TextField(blank=True, null=True)
    ai_confidence = models.JSONField(
        default=dict, blank=True, help_text="AI relevance detection confidence scores"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_proposals",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["proposer", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.proposal_type}: {self.name} - {self.status}"
