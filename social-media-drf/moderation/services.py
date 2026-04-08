import logging
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import UserModerationStatus, ModerationEvent, CategoryProposal
from .policy import KeywordFilter, keyword_filter
from .openai_adapter import OpenAIModerationAdapter, openai_moderation

logger = logging.getLogger(__name__)

User = get_user_model()

WARNING_THRESHOLD = 5
DUPLICATE_TIME_WINDOW_MINUTES = 5
DUPLICATE_CONTENT_SIMILARITY_THRESHOLD = 0.9

CONTENT_TYPE_MAP = {
    "chat": "chat_message",
    "chat_message": "chat_message",
    "post": "post",
    "comment": "comment",
    "marketplace_product": "marketplace_product",
    "category": "category_proposal",
    "category_proposal": "category_proposal",
}


@dataclass
class ModerationDecision:
    is_approved: bool
    decision: str
    rejection_reason: Optional[str] = None
    violation_type: Optional[str] = None
    warning_issued: bool = False
    auto_blocked: bool = False
    ai_flags: Dict[str, Any] = None
    ai_model: Optional[str] = None
    requires_review: bool = False
    pending_reason: Optional[str] = None

    def __post_init__(self):
        if self.ai_flags is None:
            self.ai_flags = {}


class ModerationService:
    """
    Central moderation service that coordinates all moderation layers:
    1. Keyword filter (client-side first check)
    2. Server-side keyword/rule filter
    3. OpenAI Moderation API

    Manages warning counts, ban rules, and admin notifications.
    """

    def __init__(self):
        self.keyword_filter = keyword_filter
        self.ai_adapter = openai_moderation

    def moderate_content(
        self,
        user,
        content: str,
        content_type: str,
        content_id: int = None,
        skip_ai: bool = False,
    ) -> ModerationDecision:
        """
        Run full moderation pipeline on content.

        Args:
            user: The user submitting the content
            content: The text content to moderate
            content_type: Type of content (chat, post, comment, category)
            content_id: Optional ID of the content (for updates)
            skip_ai: Skip AI moderation (for testing or performance)

        Returns:
            ModerationDecision with the moderation result
        """
        if not user or not user.is_authenticated:
            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Authentication required",
            )

        moderation_status = self._get_or_create_moderation_status(user)

        if moderation_status.is_blocked:
            self._log_moderation_event(
                user=user,
                content_type=content_type,
                content_id=content_id,
                content_text=content,
                decision="rejected",
                rejection_reason="User is blocked from posting",
                violation_type="safety",
            )
            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Your account has been blocked. Please contact an administrator.",
            )

        if not content or not content.strip():
            return ModerationDecision(is_approved=True, decision="approved")

        if self._is_duplicate_content(user, content, content_type):
            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Duplicate content detected. Please avoid posting the same message repeatedly.",
                violation_type="spam",
            )

        keyword_result = self.keyword_filter.check_content(content, content_type)

        if keyword_result.is_blocked:
            warning_issued = self.process_violation(
                user, keyword_result.violation_type, moderation_status
            )


            self._log_moderation_event(
                user=user,
                content_type=content_type,
                content_id=content_id,
                content_text=content,
                decision="rejected",
                rejection_reason=keyword_result.reason,
                violation_type=keyword_result.violation_type,
                warning_issued=warning_issued,
            )

            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason=keyword_result.reason,
                violation_type=keyword_result.violation_type,
                warning_issued=warning_issued,
            )

        if skip_ai:
            return ModerationDecision(is_approved=True, decision="approved")

        ai_result = self.ai_adapter.moderate_text(content)

        if not ai_result.is_available:
            pending_reason = (
                "Automated moderation could not verify this content yet. "
                "It has been sent for manual review."
            )

            self._log_moderation_event(
                user=user,
                content_type=content_type,
                content_id=content_id,
                content_text=content,
                decision="pending_review",
                rejection_reason=ai_result.error or pending_reason,
                ai_model=ai_result.model,
                ai_flags=ai_result.categories,
            )

            return ModerationDecision(
                is_approved=True,
                decision="pending_review",
                ai_flags=ai_result.categories,
                ai_model=ai_result.model,
                requires_review=True,
                pending_reason=pending_reason,
            )

        if ai_result.is_flagged:
            warning_issued = self.process_violation(user, "safety", moderation_status)

            auto_blocked = moderation_status.warning_count >= WARNING_THRESHOLD


            self._log_moderation_event(
                user=user,
                content_type=content_type,
                content_id=content_id,
                content_text=content,
                decision="rejected",
                rejection_reason=f"Content flagged by AI moderation: {ai_result.violation_type}",
                violation_type="safety",
                warning_issued=warning_issued,
                auto_blocked=auto_blocked,
                ai_model=ai_result.model,
                ai_flags=ai_result.categories,
            )

            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Your content was flagged by our automated moderation system. Please ensure your content follows our community guidelines.",
                violation_type="safety",
                warning_issued=warning_issued,
                auto_blocked=auto_blocked,
                ai_flags=ai_result.categories,
                ai_model=ai_result.model,
            )

        self._log_moderation_event(
            user=user,
            content_type=content_type,
            content_id=content_id,
            content_text=content,
            decision="approved",
            violation_type=None,
            ai_model=ai_result.model,
            ai_flags=ai_result.categories,
        )

        return ModerationDecision(is_approved=True, decision="approved")

    def moderate_content_ai_only(
        self,
        user,
        content: str,
        content_type: str,
        content_id: int = None,
    ) -> ModerationDecision:
        """
        Run only the slower AI moderation step.

        This is intended for latency-sensitive flows, such as chat, where a fast
        local rules pass already happened inline and AI review can happen later.
        """
        if not user or not user.is_authenticated:
            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Authentication required",
            )

        moderation_status = self._get_or_create_moderation_status(user)

        if moderation_status.is_blocked:
            self._log_moderation_event(
                user=user,
                content_type=content_type,
                content_id=content_id,
                content_text=content,
                decision="rejected",
                rejection_reason="User is blocked from posting",
                violation_type="safety",
            )
            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Your account has been blocked. Please contact an administrator.",
            )

        if not content or not content.strip():
            return ModerationDecision(is_approved=True, decision="approved")

        ai_result = self.ai_adapter.moderate_text(content)

        if not ai_result.is_available:
            pending_reason = (
                "Automated moderation could not verify this content yet. "
                "It has been sent for manual review."
            )

            self._log_moderation_event(
                user=user,
                content_type=content_type,
                content_id=content_id,
                content_text=content,
                decision="pending_review",
                rejection_reason=ai_result.error or pending_reason,
                ai_model=ai_result.model,
                ai_flags=ai_result.categories,
            )

            return ModerationDecision(
                is_approved=True,
                decision="pending_review",
                ai_flags=ai_result.categories,
                ai_model=ai_result.model,
                requires_review=True,
                pending_reason=pending_reason,
            )

        if ai_result.is_flagged:
            warning_issued = self.process_violation(user, "safety", moderation_status)
            auto_blocked = moderation_status.warning_count >= WARNING_THRESHOLD

            self._log_moderation_event(
                user=user,
                content_type=content_type,
                content_id=content_id,
                content_text=content,
                decision="rejected",
                rejection_reason=f"Content flagged by AI moderation: {ai_result.violation_type}",
                violation_type="safety",
                warning_issued=warning_issued,
                auto_blocked=auto_blocked,
                ai_model=ai_result.model,
                ai_flags=ai_result.categories,
            )

            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Your message was removed by automated moderation. Please follow our community guidelines.",
                violation_type="safety",
                warning_issued=warning_issued,
                auto_blocked=auto_blocked,
                ai_flags=ai_result.categories,
                ai_model=ai_result.model,
            )

        self._log_moderation_event(
            user=user,
            content_type=content_type,
            content_id=content_id,
            content_text=content,
            decision="approved",
            violation_type=None,
            ai_model=ai_result.model,
            ai_flags=ai_result.categories,
        )

        return ModerationDecision(is_approved=True, decision="approved")

    def moderate_category_proposal(
        self, user, name: str, description: str = "", parent_category_id: int = None
    ) -> ModerationDecision:
        """
        Moderate a category/subcategory proposal for relevance to forum theme.
        """
        if not user or not user.is_authenticated:
            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Authentication required",
            )

        moderation_status = self._get_or_create_moderation_status(user)

        if moderation_status.is_blocked:
            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Your account has been blocked. Please contact an administrator.",
            )

        # 1. First check overall safety with OpenAI
        ai_result = self.ai_adapter.moderate_text(f"{name} {description}")

        if ai_result.is_flagged:
            warning_issued = self.process_violation(user, "safety", moderation_status)
            auto_blocked = moderation_status.warning_count >= WARNING_THRESHOLD


            self._log_moderation_event(
                user=user,
                content_type="category_proposal",
                content_text=f"{name} - {description}",
                decision="rejected",
                rejection_reason=f"Category proposal flagged by AI moderation: {ai_result.violation_type}",
                violation_type="safety",
                warning_issued=warning_issued,
                auto_blocked=auto_blocked,
                ai_model=ai_result.model,
                ai_flags=ai_result.categories,
            )

            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason="Your category proposal was flagged as inappropriate. Please ensure your proposal follows our community guidelines.",
                violation_type="safety",
                warning_issued=warning_issued,
                auto_blocked=auto_blocked,
            )

        # 2. Check relevance/theme using AI
        is_relevant, rejection_reason = self.ai_adapter.check_theme_relevance(name, description)

        # Fallback to keyword filter if AI couldn't decide or if we want extra validation
        if is_relevant:
            kw_relevant, kw_reason, kw_confidence = self.keyword_filter.check_category_relevance(name, description)
            # If keyword filter is VERY sure it's bad (irrelevant matches), we might still want to flag it for review
            if not kw_relevant and kw_confidence.get("irrelevant_score", 0) > 0.1:
                is_relevant = False
                rejection_reason = kw_reason

        if not is_relevant:
            self._log_moderation_event(
                user=user,
                content_type="category_proposal",
                content_text=f"{name} - {description}",
                decision="rejected",
                rejection_reason=rejection_reason,
                violation_type="unrelated",
            )

            return ModerationDecision(
                is_approved=False,
                decision="rejected",
                rejection_reason=rejection_reason,
                violation_type="unrelated",
            )


        return ModerationDecision(
            is_approved=True,
            decision="approved",
            ai_model="gpt-4o-mini",
        )



    def _get_or_create_moderation_status(self, user) -> UserModerationStatus:
        """Get or create user moderation status"""
        status, created = UserModerationStatus.objects.get_or_create(
            user=user, defaults={"warning_count": 0, "is_blocked": False}
        )
        return status

    def process_violation(
        self, user, violation_type: str, moderation_status: UserModerationStatus = None
    ) -> bool:
        """
        Process a violation - increment warning count and potentially block user.

        Returns:
            True if a warning was issued
        """
        if moderation_status is None:
            moderation_status = self._get_or_create_moderation_status(user)

        should_warn = violation_type in ["safety", "spam"]

        if should_warn:
            old_count = moderation_status.warning_count
            moderation_status.increment_warning(
                reason=f"Violation type: {violation_type}"
            )
            logger.warning(f"MODERATION STRIKE: User {user.username} (ID: {user.id}) received warning {moderation_status.warning_count}/5 for {violation_type}")

            if moderation_status.warning_count >= WARNING_THRESHOLD:
                logger.error(f"MODERATION BLOCK: User {user.username} (ID: {user.id}) has been AUTO-BLOCKED after 5 warnings.")
                self._notify_admin_user_blocked(user, moderation_status)


            return True

        return False

    def _is_duplicate_content(self, user, content: str, content_type: str) -> bool:
        """Check if user is sending duplicate/spam content"""
        content_normalized = content.lower().strip()

        time_window = timezone.now() - timedelta(minutes=DUPLICATE_TIME_WINDOW_MINUTES)

        recent_events = ModerationEvent.objects.filter(
            user=user,
            content_type=CONTENT_TYPE_MAP.get(content_type, content_type),
            created_at__gte=time_window,
            decision="rejected",
        ).values_list("content_text", flat=True)[:10]

        for previous_content in recent_events:
            if not previous_content:
                continue

            previous_normalized = previous_content.lower().strip()

            if previous_normalized == content_normalized:
                logger.info(
                    f"Duplicate content detected for user {user.id}: exact match"
                )
                return True

            if len(content_normalized) > 20 and len(previous_normalized) > 20:
                if (
                    content_normalized in previous_normalized
                    or previous_normalized in content_normalized
                ):
                    logger.info(
                        f"Duplicate content detected for user {user.id}: substring match"
                    )
                    return True

        return False

    def _log_moderation_event(
        self,
        user,
        content_type: str,
        content_id: int = None,
        content_text: str = None,
        decision: str = "approved",
        rejection_reason: str = None,
        violation_type: str = None,
        warning_issued: bool = False,
        auto_blocked: bool = False,
        ai_model: str = None,
        ai_flags: dict = None,
    ):
        """Log a moderation event for auditability"""
        try:
            ModerationEvent.objects.create(
                user=user,
                content_type=CONTENT_TYPE_MAP.get(content_type, content_type),
                content_id=content_id,
                content_text=content_text[:500] if content_text else None,
                decision=decision,
                rejection_reason=rejection_reason,
                violation_type=violation_type,
                warning_issued=warning_issued,
                auto_blocked=auto_blocked,
                ai_model_used=ai_model,
                ai_flags=ai_flags or {},
            )
        except Exception as e:
            logger.error(f"Failed to log moderation event: {e}")

    def _notify_admin_user_blocked(self, user, moderation_status: UserModerationStatus):
        """Send email notification to admins when a user is blocked"""
        try:
            admins = User.objects.filter(role="admin", is_active=True)

            if not admins.exists():
                admins = User.objects.filter(is_superuser=True, is_active=True)

            if not admins.exists():
                logger.warning("No admins found to notify about blocked user")
                return

            subject = f"User Blocked: {user.username} - Auto-block after 5 warnings"

            message = f"""
User Account Blocked
====================

Username: {user.username}
Email: {user.email}
User ID: {user.id}

Warning Count: {moderation_status.warning_count}/5
Blocked At: {moderation_status.blocked_at}
Block Reason: {moderation_status.blocked_reason}

This user has been automatically blocked after receiving 5 warnings for policy violations.

Please review the moderation events in the admin panel.
"""

            admin_emails = [admin.email for admin in admins]

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=False,
            )

            logger.info(f"Admin notification sent for blocked user {user.username}")

        except Exception as e:
            logger.error(f"Failed to send admin notification: {e}")

    def report_violation(
        self,
        user,
        violation_type: str,
        content_type: str,
        content_id: int = None,
        content_text: str = None,
        rejection_reason: str = None,
    ) -> bool:
        """
        Manually report a violation (e.g., from image moderation) and issue a strike.
        """
        moderation_status = self._get_or_create_moderation_status(user)
        warning_issued = self.process_violation(
            user, violation_type, moderation_status
        )
        auto_blocked = moderation_status.warning_count >= WARNING_THRESHOLD

        self._log_moderation_event(
            user=user,
            content_type=content_type,
            content_id=content_id,
            content_text=content_text,
            decision="rejected",
            rejection_reason=rejection_reason,
            violation_type=violation_type,
            warning_issued=warning_issued,
            auto_blocked=auto_blocked,
        )
        return warning_issued

    def check_user_can_post(self, user) -> Tuple[bool, str]:

        """Check if user can post content"""
        if not user or not user.is_authenticated:
            return False, "Authentication required"

        moderation_status = self._get_or_create_moderation_status(user)

        if moderation_status.is_blocked:
            return (
                False,
                "Your account has been blocked. Please contact an administrator.",
            )

        return True, ""

    def get_user_warning_status(self, user) -> Dict[str, Any]:
        """Get user's warning status"""
        moderation_status = self._get_or_create_moderation_status(user)

        return {
            "warning_count": moderation_status.warning_count,
            "max_warnings": WARNING_THRESHOLD,
            "is_blocked": moderation_status.is_blocked,
            "blocked_at": moderation_status.blocked_at,
            "blocked_reason": moderation_status.blocked_reason,
        }

    def reset_user_warnings(self, user, admin_notes: str = None) -> bool:
        """Reset user's warning count (admin action)"""
        try:
            moderation_status = self._get_or_create_moderation_status(user)
            moderation_status.reset_warnings()

            if admin_notes:
                moderation_status.admin_notes = admin_notes
                moderation_status.save()

            return True
        except Exception as e:
            logger.error(f"Failed to reset warnings: {e}")
            return False

    def reduce_user_warnings(
        self, user, amount: int = 1, admin_notes: str = None
    ) -> bool:
        """Reduce user's warning count (admin action)"""
        try:
            moderation_status = self._get_or_create_moderation_status(user)
            moderation_status.decrement_warnings(amount)

            if admin_notes:
                moderation_status.admin_notes = admin_notes
                moderation_status.save()

            return True
        except Exception as e:
            logger.error(f"Failed to reduce warnings: {e}")
            return False

    def unblock_user(self, user, admin_notes: str = None) -> bool:
        """Unblock a user (admin action)"""
        try:
            moderation_status = self._get_or_create_moderation_status(user)
            moderation_status.unblock()

            if admin_notes:
                moderation_status.admin_notes = admin_notes
                moderation_status.save()

            return True
        except Exception as e:
            logger.error(f"Failed to unblock user: {e}")
            return False

    def block_user(self, user, reason: str, admin_notes: str = None) -> bool:
        """Manually block a user (admin action)"""
        try:
            moderation_status = self._get_or_create_moderation_status(user)
            moderation_status.is_blocked = True
            moderation_status.blocked_at = timezone.now()
            moderation_status.blocked_reason = reason
            moderation_status.warning_count = WARNING_THRESHOLD
            moderation_status.save()

            if admin_notes:
                moderation_status.admin_notes = admin_notes
                moderation_status.save()

            return True
        except Exception as e:
            logger.error(f"Failed to block user: {e}")
            return False


moderation_service = ModerationService()
