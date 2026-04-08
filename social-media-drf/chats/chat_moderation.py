import logging
from concurrent.futures import ThreadPoolExecutor

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import close_old_connections
from django.utils import timezone

from moderation.models import UserModerationStatus
from moderation.services import moderation_service

from .models import Message

logger = logging.getLogger(__name__)


_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="chat-moderation")


def schedule_message_ai_review(message_id: int):
    """Run the slower AI moderation step off the request/WebSocket hot path."""
    return _executor.submit(run_message_ai_review, message_id)


def run_message_ai_review(message_id: int):
    """
    AI-review a chat message after it has been sent.

    Messages that pass the fast local checks are shown immediately, then removed
    if AI moderation later flags them.
    """
    close_old_connections()
    try:
        try:
            message = Message.objects.select_related("sender", "receiver", "room").get(
                id=message_id
            )
        except Message.DoesNotExist:
            return None

        if message.ai_moderation_status != Message.AI_MODERATION_PENDING:
            return message.ai_moderation_status

        decision = moderation_service.moderate_content_ai_only(
            user=message.sender,
            content=message.content or "",
            content_type="chat",
            content_id=message.id,
        )

        if decision.is_approved:
            Message.objects.filter(
                id=message.id,
                ai_moderation_status=Message.AI_MODERATION_PENDING,
            ).update(
                ai_moderation_status=Message.AI_MODERATION_APPROVED,
                moderation_rejection_reason="",
                ai_moderated_at=timezone.now(),
            )
            return Message.AI_MODERATION_APPROVED

        if decision.requires_review:
            Message.objects.filter(
                id=message.id,
                ai_moderation_status=Message.AI_MODERATION_PENDING,
            ).update(
                ai_moderation_status=Message.AI_MODERATION_REVIEW_REQUIRED,
                moderation_rejection_reason=decision.pending_reason or "",
                ai_moderated_at=timezone.now(),
            )
            return Message.AI_MODERATION_REVIEW_REQUIRED

        warning_count = 0
        if decision.warning_issued:
            warning_count = (
                UserModerationStatus.objects.filter(user=message.sender)
                .values_list("warning_count", flat=True)
                .first()
                or 0
            )

        updated = Message.objects.filter(
            id=message.id,
            ai_moderation_status__in=[
                Message.AI_MODERATION_PENDING,
                Message.AI_MODERATION_REVIEW_REQUIRED,
                Message.AI_MODERATION_APPROVED,
            ],
        ).update(
            ai_moderation_status=Message.AI_MODERATION_REJECTED,
            moderation_rejection_reason=decision.rejection_reason or "",
            ai_moderated_at=timezone.now(),
        )

        if updated:
            _broadcast_message_removed(
                message=message,
                reason=decision.rejection_reason
                or "This message was removed by moderation.",
                warning_count=warning_count,
                auto_blocked=decision.auto_blocked,
            )

        return Message.AI_MODERATION_REJECTED
    except Exception:
        logger.exception(
            "Failed async AI moderation review for chat message %s", message_id
        )
        return None
    finally:
        close_old_connections()


def _broadcast_message_removed(message, reason: str, warning_count: int, auto_blocked: bool):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    payload = {
        "type": "message_deleted",
        "message_id": message.id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "room_id": message.room_id,
        "moderated": True,
        "reason": reason,
        "warning_count": warning_count,
        "auto_blocked": auto_blocked,
    }

    if message.room_id:
        async_to_sync(channel_layer.group_send)(f"chat_{message.room_id}", payload)
        return

    recipients = {message.sender_id}
    if message.receiver_id:
        recipients.add(message.receiver_id)

    for user_id in recipients:
        async_to_sync(channel_layer.group_send)(f"user_{user_id}", payload)
