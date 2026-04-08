from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from community.models import Community, CommunityInvitation, CommunityJoinRequest, CommunityMember
from moderation.openai_adapter import ModerationResult


User = get_user_model()


class CommunityModerationTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="testpass123",
        )
        self.member = User.objects.create_user(
            username="member",
            email="member@example.com",
            password="testpass123",
        )
        self.invitee = User.objects.create_user(
            username="invitee",
            email="invitee@example.com",
            password="testpass123",
        )

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_safe_community_is_approved(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        self.client.force_authenticate(self.creator)

        response = self.client.post(
            "/api/communities/",
            {
                "name": "peacefulspace",
                "title": "Peaceful Space",
                "description": "A calm community for reflective discussion.",
                "visibility": "public",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        community = Community.objects.get(name="peacefulspace")
        self.assertEqual(community.status, "approved")
        self.assertEqual(community.rejection_reason, "")

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_profanity_community_is_pending(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        self.client.force_authenticate(self.creator)

        response = self.client.post(
            "/api/communities/",
            {
                "name": "respecthub",
                "title": "fuck club",
                "description": "bad words",
                "visibility": "public",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        community = Community.objects.get(name="respecthub")
        self.assertEqual(community.status, "pending")
        self.assertIn("inappropriate language", community.rejection_reason.lower())

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_ai_unavailable_community_is_pending(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=False,
            error="Moderation timeout",
        )
        self.client.force_authenticate(self.creator)

        response = self.client.post(
            "/api/communities/",
            {
                "name": "reviewspace",
                "title": "Review Space",
                "description": "Needs moderation review.",
                "visibility": "public",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        community = Community.objects.get(name="reviewspace")
        self.assertEqual(community.status, "pending")
        self.assertIn("manual review", community.rejection_reason.lower())

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_community_update_with_profanity_becomes_pending(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        community = Community.objects.create(
            name="updatable",
            title="Updatable",
            description="Clean start",
            visibility="public",
            created_by=self.creator,
            status="approved",
        )
        CommunityMember.objects.create(
            user=self.creator,
            community=community,
            role="admin",
            is_approved=True,
        )
        self.client.force_authenticate(self.creator)

        response = self.client.patch(
            f"/api/communities/{community.name}/",
            {"title": "fuck update", "description": "still bad"},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        community.refresh_from_db()
        self.assertEqual(community.status, "pending")
        self.assertIn("inappropriate language", community.rejection_reason.lower())

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_join_request_message_is_rejected_when_flagged(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        community = Community.objects.create(
            name="restrictedspace",
            title="Restricted Space",
            description="Members only",
            visibility="restricted",
            created_by=self.creator,
            status="approved",
        )
        CommunityMember.objects.create(
            user=self.creator,
            community=community,
            role="admin",
            is_approved=True,
        )
        self.client.force_authenticate(self.member)

        response = self.client.post(
            f"/api/communities/{community.name}/join/",
            {"message": "fuck you all"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(CommunityJoinRequest.objects.filter(community=community, user=self.member).exists())

    @patch("moderation.services.openai_moderation.moderate_text")
    def test_invitation_message_is_rejected_when_flagged(self, mock_moderate_text):
        mock_moderate_text.return_value = ModerationResult(
            is_flagged=False,
            is_available=True,
            model="omni-moderation-latest",
        )
        community = Community.objects.create(
            name="privatespace",
            title="Private Space",
            description="Private members",
            visibility="private",
            created_by=self.creator,
            status="approved",
        )
        CommunityMember.objects.create(
            user=self.creator,
            community=community,
            role="admin",
            is_approved=True,
        )
        self.client.force_authenticate(self.creator)

        response = self.client.post(
            "/api/communities/invite/",
            {
                "community": community.name,
                "user_id": self.invitee.id,
                "message": "fuck off",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(CommunityInvitation.objects.filter(community=community, invitee=self.invitee).exists())

    def test_pending_community_is_hidden_from_other_users(self):
        community = Community.objects.create(
            name="hiddenreview",
            title="Hidden Review",
            description="Pending review",
            visibility="public",
            created_by=self.creator,
            status="pending",
            rejection_reason="Needs review",
        )
        CommunityMember.objects.create(
            user=self.creator,
            community=community,
            role="admin",
            is_approved=True,
        )

        self.client.force_authenticate(self.member)
        response = self.client.get("/api/communities/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        communities = response.data.get("data", [])
        self.assertFalse(any(item.get("name") == "hiddenreview" for item in communities))
