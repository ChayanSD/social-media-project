from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from marketplace.models import Category, Product, SubCategory
from moderation.openai_adapter import ModerationResult


User = get_user_model()


def make_test_image(name="test.jpg"):
    buffer = BytesIO()
    image = Image.new("RGB", (10, 10), color="white")
    image.save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")


class MarketplaceModerationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="seller",
            email="seller@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(self.user)
        self.category = Category.objects.create(name="Services")
        self.subcategory = SubCategory.objects.create(
            name="Consulting",
            category=self.category,
        )
        self.url = "/api/marketplace/items/"

    @patch("marketplace.views.check_image_content")
    @patch("moderation.services.openai_moderation.moderate_text")
    def test_safe_service_is_approved(self, mock_moderate_text, mock_check_image_content):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        mock_check_image_content.return_value = (True, None)

        response = self.client.post(
            self.url,
            {
                "name": "Helpful coaching",
                "image": make_test_image(),
                "status": "approved",
                "sub_category": self.subcategory.id,
                "description": "A calm and useful service.",
                "location": "Dhaka",
                "link": "https://example.com/service",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get()
        self.assertEqual(product.status, "approved")
        self.assertEqual(product.rejection_reason, "")

    @patch("marketplace.views.check_image_content")
    @patch("moderation.services.openai_moderation.moderate_text")
    def test_profanity_service_is_pending(self, mock_moderate_text, mock_check_image_content):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        mock_check_image_content.return_value = (True, None)

        response = self.client.post(
            self.url,
            {
                "name": "fuck service",
                "image": make_test_image(),
                "status": "approved",
                "sub_category": self.subcategory.id,
                "description": "bad description",
                "location": "Dhaka",
                "link": "https://example.com/service",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get()
        self.assertEqual(product.status, "pending")
        self.assertIn("inappropriate language", product.rejection_reason.lower())

    @patch("marketplace.views.check_image_content")
    @patch("moderation.services.openai_moderation.moderate_text")
    def test_ai_unavailable_service_is_pending(self, mock_moderate_text, mock_check_image_content):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=False,
            error="Moderation timeout",
        )
        mock_check_image_content.return_value = (True, None)

        response = self.client.post(
            self.url,
            {
                "name": "Review service",
                "image": make_test_image(),
                "status": "approved",
                "sub_category": self.subcategory.id,
                "description": "Needs moderation review.",
                "location": "Dhaka",
                "link": "https://example.com/service",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get()
        self.assertEqual(product.status, "pending")
        self.assertIn("manual review", product.rejection_reason.lower())

    @patch("marketplace.views.check_image_content")
    @patch("moderation.services.openai_moderation.moderate_text")
    def test_draft_publish_with_profanity_becomes_pending(self, mock_moderate_text, mock_check_image_content):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        mock_check_image_content.return_value = (True, None)

        product = Product.objects.create(
            user=self.user,
            name="Draft service",
            image=make_test_image("draft.jpg"),
            status="draft",
            sub_category=self.subcategory,
            description="Clean description",
            location="Dhaka",
            link="https://example.com/service",
        )

        response = self.client.patch(
            f"{self.url}{product.id}/",
            {
                "status": "approved",
                "name": "fuck publish",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.status, "pending")
        self.assertIn("inappropriate language", product.rejection_reason.lower())
