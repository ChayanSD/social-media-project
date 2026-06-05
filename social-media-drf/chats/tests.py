from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AcceptedMessage, Message, Room


User = get_user_model()


class ChatModerationRemovalTests(APITestCase):
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

    def test_direct_message_sent_immediately_approved(self):
        """Direct messages should be sent and approved immediately without AI review queueing"""
        response = self.client.post(
            "/api/chat/messages/send/",
            {"receiver_id": self.receiver.id, "content": "Hello there"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(sender=self.sender, receiver=self.receiver)
        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_APPROVED)

        conversation = self.client.get(
            f"/api/chat/messages/conversation/?user_id={self.receiver.id}"
        )
        self.assertEqual(conversation.status_code, status.HTTP_200_OK)
        self.assertEqual(len(conversation.data["data"]), 1)

    def test_room_message_sent_immediately_approved(self):
        """Room messages should be sent and approved immediately"""
        response = self.client.post(
            f"/api/chat/rooms/{self.room.id}/send_message/",
            {"content": "Hello everyone in the room"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(room=self.room, sender=self.sender)
        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_APPROVED)

    def test_room_message_with_profanity_not_blocked(self):
        """Profanity keywords should not block room messages anymore"""
        response = self.client.post(
            f"/api/chat/rooms/{self.room.id}/send_message/",
            {"content": "fuck you"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        message = Message.objects.get(room=self.room, sender=self.sender, content="fuck you")
        self.assertEqual(message.ai_moderation_status, Message.AI_MODERATION_APPROVED)
