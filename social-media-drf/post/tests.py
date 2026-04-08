from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from moderation.models import ModerationEvent
from moderation.openai_adapter import ModerationResult
from post.models import Post


User = get_user_model()


class PostModerationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="poster",
            email="poster@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(self.user)
        self.url = "/api/posts/"

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_safe_post_is_approved_when_ai_approves(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )

        response = self.client.post(
            self.url,
            {
                "title": "A calm update",
                "content": "Sharing a peaceful thought for today.",
                "post_type": "text",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get()
        self.assertEqual(post.status, "approved")
        self.assertEqual(post.rejection_reason, "")

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_profanity_post_is_saved_as_pending(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )

        response = self.client.post(
            self.url,
            {
                "title": "fuck you",
                "content": "",
                "post_type": "text",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get()
        self.assertEqual(post.status, "pending")
        self.assertIn("inappropriate language", post.rejection_reason.lower())
        self.assertEqual(
            ModerationEvent.objects.filter(
                user=self.user,
                content_type="post",
                decision="rejected",
            ).count(),
            1,
        )

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_post_is_pending_when_ai_cannot_verify_content(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=False,
            error="Moderation timeout",
        )

        response = self.client.post(
            self.url,
            {
                "title": "Needs review",
                "content": "This should wait until AI moderation is available.",
                "post_type": "text",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get()
        self.assertEqual(post.status, "pending")
        self.assertIn("manual review", post.rejection_reason.lower())
        self.assertTrue(
            ModerationEvent.objects.filter(
                user=self.user,
                content_type="post",
                decision="pending_review",
            ).exists()
        )
