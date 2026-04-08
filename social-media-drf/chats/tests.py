from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from moderation.models import UserModerationStatus
from moderation.openai_adapter import ModerationResult

from .chat_moderation import run_message_ai_review
from .models import AcceptedMessage, Message, Room


User = get_user_model()


class ChatAsyncModerationTests(APITestCase):
    def setUp(self):
        self.sender = User.objects.create_user(
            username="sender",
            email="sender@example.com",
            password="testpass123",
        )
        self.receiver = User.objects.create_user(
            username="receiver",
            email="receiver@example.com",
            password="testpass123",
        )
        self.room = Room.objects.create(is_group=True, name="Focus Room")
        self.room.participants.add(self.sender, self.receiver)
        self.room.admins.add(self.sender)
        AcceptedMessage.objects.create(
            user1=self.sender,
            user2=self.receiver,
            accepted_by=self.sender,
        )
        self.client.force_authenticate(self.sender)

    @patch("chats.views.schedule_message_ai_review")
    @patch("moderation.services.openai_moderation.moderate_text")
    def test_direct_message_is_pending_then_approved_after_ai_review(
        self, mock_moderate_text, mock_schedule
    ):
        mock_schedule.return_value = None
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )

        response = self.client.post(
            "/api/chat/messages/send/",
            {"receiver_id": self.receiver.id, "content": "Hello there"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(sender=self.sender, receiver=self.receiver)
        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_PENDING)

        run_message_ai_review(message.id)
        message.refresh_from_db()

        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_APPROVED)

        conversation = self.client.get(
            f"/api/chat/messages/conversation/?user_id={self.receiver.id}"
        )
        self.assertEqual(conversation.status_code, status.HTTP_200_OK)
        self.assertEqual(len(conversation.data["data"]), 1)

    @patch("chats.views.schedule_message_ai_review")
    @patch("moderation.services.openai_moderation.moderate_text")
    def test_direct_message_flagged_by_ai_is_removed_after_review(
        self, mock_moderate_text, mock_schedule
    ):
        mock_schedule.return_value = None
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=True,
            is_available=True,
            violation_type="harassment",
            model="omni-moderation-latest",
        )

        response = self.client.post(
            "/api/chat/messages/send/",
            {"receiver_id": self.receiver.id, "content": "You are disgusting"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(sender=self.sender, receiver=self.receiver)
        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_PENDING)

        run_message_ai_review(message.id)
        message.refresh_from_db()

        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_REJECTED)
        self.assertGreater(
            UserModerationStatus.objects.get(user=self.sender).warning_count, 0
        )

        conversation = self.client.get(
            f"/api/chat/messages/conversation/?user_id={self.receiver.id}"
        )
        self.assertEqual(conversation.status_code, status.HTTP_200_OK)
        self.assertEqual(conversation.data["data"], [])

    @patch("chats.views.schedule_message_ai_review")
    @patch("moderation.services.openai_moderation.moderate_text")
    def test_room_message_ai_unavailable_stays_visible_but_marked_for_review(
        self, mock_moderate_text, mock_schedule
    ):
        mock_schedule.return_value = None
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=False,
            error="Moderation timeout",
        )

        response = self.client.post(
            f"/api/chat/rooms/{self.room.id}/send_message/",
            {"content": "This should stay visible while AI is unavailable."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(room=self.room, sender=self.sender)
        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_PENDING)

        run_message_ai_review(message.id)
        message.refresh_from_db()

        self.assertEqual(
            message.ai_moderation_status, Message.AI_MODERATION_REVIEW_REQUIRED
        )

        room_messages = self.client.get(f"/api/chat/rooms/{self.room.id}/messages/")
        self.assertEqual(room_messages.status_code, status.HTTP_200_OK)
        self.assertEqual(len(room_messages.data["data"]), 1)

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_room_message_with_keyword_violation_is_rejected_immediately(
        self, mock_moderate_text
    ):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )

        response = self.client.post(
            f"/api/chat/rooms/{self.room.id}/send_message/",
            {"content": "fuck you"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            Message.objects.filter(room=self.room, sender=self.sender).exists()
        )
