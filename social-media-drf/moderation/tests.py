from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
import os

from moderation.policy import KeywordFilter, _check_safe_word_overlap
from moderation.openai_adapter import OpenAIModerationAdapter, ModerationResult
from moderation.services import ModerationService
from moderation.models import UserModerationStatus, ModerationEvent

User = get_user_model()


class KeywordFilterTests(TestCase):
    """Tests for keyword filter"""

    def setUp(self):
        self.filter = KeywordFilter()

    def test_safe_content_passes(self):
        """Safe content should pass keyword filter"""
        result = self.filter.check_content("Hello, this is a friendly message!")
        self.assertFalse(result.is_blocked)
        self.assertIsNone(result.violation_type)

    def test_safety_keyword_blocked(self):
        """Content with safety keywords should be blocked"""
        result = self.filter.check_content("I will kill you!")
        self.assertTrue(result.is_blocked)
        self.assertEqual(result.violation_type, "safety")
        self.assertIn("kill", result.matched_keywords)

    def test_spam_keyword_blocked(self):
        """Content with spam keywords should be blocked"""
        result = self.filter.check_content("Click here to win free money!")
        self.assertTrue(result.is_blocked)
        self.assertEqual(result.violation_type, "spam")

    def test_empty_content_passes(self):
        """Empty content should pass"""
        result = self.filter.check_content("")
        self.assertFalse(result.is_blocked)

    def test_whitespace_only_passes(self):
        """Whitespace-only content should pass"""
        result = self.filter.check_content("   \n\t   ")
        self.assertFalse(result.is_blocked)

    def test_short_innocent_word_passes(self):
        """Short innocent words should not be blocked"""
        result = self.filter.check_content("Hi")
        self.assertFalse(result.is_blocked)

        result = self.filter.check_content("Ok")
        self.assertFalse(result.is_blocked)

    def test_false_positive_skill_not_kill(self):
        """'skill' should not match 'kill'"""
        result = self.filter.check_content("I have great skill in cooking")
        self.assertFalse(result.is_blocked)

    def test_false_positive_grapes_not_rape(self):
        """'grapes' should not match 'rape'"""
        result = self.filter.check_content("I love grapes")
        self.assertFalse(result.is_blocked)

    def test_false_positive_begun_not_gun(self):
        """'begun' should not match 'gun'"""
        result = self.filter.check_content("The project has begun")
        self.assertFalse(result.is_blocked)

    def test_false_positive_bullet_not_bomb(self):
        """'bullet' should not match 'bomb' or 'weapon'"""
        result = self.filter.check_content("I need bullets for my gun")
        self.assertFalse(result.is_blocked)

    def test_false_positive_school_not_kill(self):
        """'school' should not match 'kill'"""
        result = self.filter.check_content("I go to school every day")
        self.assertFalse(result.is_blocked)

    def test_quoted_text_passes(self):
        """Quoted text containing keywords should be allowed"""
        result = self.filter.check_content('The word "kill" appears in this quote')
        self.assertFalse(result.is_blocked)

    def test_educational_context_passes(self):
        """Educational discussion about sensitive topics should pass"""
        result = self.filter.check_content(
            "This post discusses suicide prevention resources"
        )
        self.assertFalse(result.is_blocked)

    def test_direct_threat_blocked(self):
        """Direct threats should be blocked"""
        result = self.filter.check_content("I will kill you right now")
        self.assertTrue(result.is_blocked)
        self.assertEqual(result.violation_type, "safety")

    def test_partial_word_not_blocked(self):
        """Partial word matches should not block"""
        result = self.filter.check_content("I need to shopping for groceries")
        self.assertFalse(result.is_blocked)

    def test_category_relevance_approved(self):
        """Relevant category should be approved"""
        is_relevant, reason, confidence = self.filter.check_category_relevance(
            "Quantum Consciousness",
            "Discussion about quantum physics and consciousness",
        )
        self.assertTrue(is_relevant)
        self.assertIsNone(reason)

    def test_category_relevance_rejected(self):
        """Irrelevant category should be rejected"""
        is_relevant, reason, confidence = self.filter.check_category_relevance(
            "Best Football Team", "Discuss football teams and matches"
        )
        self.assertFalse(is_relevant)
        self.assertIsNotNone(reason)

    def test_category_borderline_quantum_healing(self):
        """Borderline category should go to review"""
        is_relevant, reason, confidence = self.filter.check_category_relevance(
            "Quantum Healing", "Energy healing through quantum methods"
        )
        self.assertTrue(is_relevant)

    def test_category_irrelevant_crypto(self):
        """Crypto-related category should be rejected"""
        is_relevant, reason, confidence = self.filter.check_category_relevance(
            "Crypto Investing", "Make money with cryptocurrency"
        )
        self.assertFalse(is_relevant)


class OpenAIModerationAdapterTests(TestCase):
    """Tests for OpenAI moderation adapter"""

    @patch("moderation.openai_adapter.requests.post")
    def test_safe_content_approved(self, mock_post):
        """Safe content should be approved"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [{"flagged": False, "categories": {}, "category_scores": {}}]
        }
        mock_post.return_value = mock_response

        adapter = OpenAIModerationAdapter(api_key="test-key")
        result = adapter.moderate_text("Hello world")

        self.assertFalse(result.is_flagged)

    @patch("moderation.openai_adapter.requests.post")
    def test_flagged_content_blocked(self, mock_post):
        """Flagged content should be blocked"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [
                {
                    "flagged": True,
                    "categories": {"violence": True},
                    "category_scores": {"violence": 0.9},
                }
            ]
        }
        mock_post.return_value = mock_response

        adapter = OpenAIModerationAdapter(api_key="test-key")
        result = adapter.moderate_text("Harmful content")

        self.assertTrue(result.is_flagged)
        self.assertEqual(result.violation_type, "violence")

    @patch("moderation.openai_adapter.requests.post")
    def test_timeout_fallback(self, mock_post):
        """Timeout should require manual review"""
        import requests

        mock_post.side_effect = requests.Timeout()

        adapter = OpenAIModerationAdapter(api_key="test-key", timeout=1)
        result = adapter.moderate_text("Test content")

        self.assertFalse(result.is_flagged)
        self.assertFalse(result.is_available)
        self.assertIsNotNone(result.error)

    @patch("moderation.openai_adapter.requests.post")
    def test_rate_limit_fallback(self, mock_post):
        """Rate limit should require manual review"""
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_post.return_value = mock_response

        adapter = OpenAIModerationAdapter(api_key="test-key")
        result = adapter.moderate_text("Test content")

        self.assertFalse(result.is_flagged)
        self.assertFalse(result.is_available)
        self.assertIsNotNone(result.error)

    @patch("moderation.openai_adapter.requests.post")
    def test_server_error_fallback(self, mock_post):
        """Server error (5xx) should require manual review"""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response

        adapter = OpenAIModerationAdapter(api_key="test-key")
        result = adapter.moderate_text("Test content")

        self.assertFalse(result.is_flagged)
        self.assertFalse(result.is_available)
        self.assertIsNotNone(result.error)

    @patch.dict(os.environ, {}, clear=True)
    def test_no_api_key_requires_review(self):
        """Missing API key should require manual review"""
        adapter = OpenAIModerationAdapter(api_key=None)
        result = adapter.moderate_text("Any content")

        self.assertFalse(result.is_flagged)
        self.assertFalse(result.is_available)


class ModerationServiceTests(TestCase):
    """Tests for main moderation service"""

    def setUp(self):
        self.service = ModerationService()
        self.user = User.objects.create_user(
            username="testuser", email="test@test.com", password="testpass123"
        )

    def test_moderate_content_safe(self):
        """Safe content should be approved"""
        with patch("moderation.services.openai_moderation.moderate_text") as mock_moderate_text:
            mock_moderate_text.return_value = ModerationResult(
                is_flagged=False,
                is_available=True,
                model="omni-moderation-latest",
            )
            decision = self.service.moderate_content(
                user=self.user, content="This is a friendly post", content_type="post"
            )

        self.assertTrue(decision.is_approved)
        self.assertEqual(decision.decision, "approved")

    def test_moderate_content_requires_review_when_ai_unavailable(self):
        """Safe content should be marked for review when AI is unavailable"""
        with patch("moderation.services.openai_moderation.moderate_text") as mock_moderate_text:
            mock_moderate_text.return_value = ModerationResult(
                is_flagged=False,
                is_available=False,
                error="Moderation timeout",
            )
            decision = self.service.moderate_content(
                user=self.user, content="This is a friendly post", content_type="post"
            )

        self.assertTrue(decision.is_approved)
        self.assertTrue(decision.requires_review)
        self.assertEqual(decision.decision, "pending_review")

    def test_moderate_content_keyword_block(self):
        """Content with keywords should be blocked"""
        decision = self.service.moderate_content(
            user=self.user, content="This is spam click here now", content_type="post"
        )

        self.assertFalse(decision.is_approved)
        self.assertEqual(decision.decision, "rejected")
        self.assertTrue(decision.warning_issued)

    def test_blocked_user_cannot_post(self):
        """Blocked user should not be able to post"""
        status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        status.is_blocked = True
        status.save()

        can_post, reason = self.service.check_user_can_post(self.user)

        self.assertFalse(can_post)
        self.assertIn("blocked", reason.lower())

    def test_warning_count_increments(self):
        """Warning count should increment on violation"""
        initial_status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        initial_count = initial_status.warning_count

        self.service.moderate_content(
            user=self.user, content="I will kill you", content_type="chat"
        )

        final_status = UserModerationStatus.objects.get(user=self.user)
        self.assertEqual(final_status.warning_count, initial_count + 1)

    def test_fifth_warning_blocks_user(self):
        """User should be blocked on 5th warning"""
        status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        status.warning_count = 4
        status.save()

        self.service.moderate_content(
            user=self.user, content="spam content click here", content_type="chat"
        )

        final_status = UserModerationStatus.objects.get(user=self.user)
        self.assertTrue(final_status.is_blocked)
        self.assertIsNotNone(final_status.blocked_at)

    def test_unrelated_category_no_warning(self):
        """Unrelated category proposals should not issue warnings"""
        initial_status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        initial_count = initial_status.warning_count

        decision = self.service.moderate_category_proposal(
            user=self.user, name="Football", description="All about football"
        )

        self.assertFalse(decision.is_approved)
        final_status = UserModerationStatus.objects.get(user=self.user)
        self.assertEqual(final_status.warning_count, initial_count)

    def test_moderation_event_logged(self):
        """Moderation events should be logged"""
        self.service.moderate_content(
            user=self.user, content="Test content", content_type="post"
        )

        events = ModerationEvent.objects.filter(user=self.user)
        self.assertGreater(events.count(), 0)

    def test_category_proposal_rejected(self):
        """Irrelevant category proposals should be rejected"""
        decision = self.service.moderate_category_proposal(
            user=self.user, name="Football Teams", description="All about football"
        )

        self.assertFalse(decision.is_approved)
        self.assertEqual(decision.violation_type, "unrelated")

    def test_category_proposal_approved(self):
        """Relevant category proposals should be approved"""
        decision = self.service.moderate_category_proposal(
            user=self.user,
            name="Quantum Consciousness",
            description="Exploring quantum physics and consciousness",
        )

        self.assertTrue(decision.is_approved)

    def test_reset_warnings(self):
        """Warnings should be resettable"""
        status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        status.warning_count = 3
        status.save()

        result = self.service.reset_user_warnings(self.user, "Reset by admin")

        self.assertTrue(result)
        final_status = UserModerationStatus.objects.get(user=self.user)
        self.assertEqual(final_status.warning_count, 0)
        self.assertFalse(final_status.is_blocked)

    def test_unblock_user(self):
        """Users should be unblockable"""
        status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        status.is_blocked = True
        status.warning_count = 5
        status.save()

        result = self.service.unblock_user(self.user, "Unblocked by admin")

        self.assertTrue(result)
        final_status = UserModerationStatus.objects.get(user=self.user)
        self.assertFalse(final_status.is_blocked)
        self.assertEqual(final_status.warning_count, 5)

    def test_manual_block_user(self):
        """Admin should be able to manually block users"""
        result = self.service.block_user(
            self.user, reason="Manual block by admin", admin_notes="Spam activity"
        )

        self.assertTrue(result)
        final_status = UserModerationStatus.objects.get(user=self.user)
        self.assertTrue(final_status.is_blocked)
        self.assertEqual(final_status.warning_count, 5)
        self.assertEqual(final_status.blocked_reason, "Manual block by admin")

    def test_duplicate_content_rejected(self):
        """Duplicate content should be rejected without warning increment"""
        initial_status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        initial_count = initial_status.warning_count

        content = "This is test duplicate content"
        self.service.moderate_content(
            user=self.user, content=content, content_type="chat"
        )
        self.service.moderate_content(
            user=self.user, content=content, content_type="chat"
        )

        final_status = UserModerationStatus.objects.get(user=self.user)
        self.assertEqual(final_status.warning_count, initial_count + 1)

    def test_minimal_content_passes(self):
        """Minimal content should not trigger warnings"""
        decision = self.service.moderate_content(
            user=self.user, content="OK", content_type="chat"
        )

        self.assertTrue(decision.is_approved)

    def test_blocked_user_cannot_create_category(self):
        """Blocked user cannot create category proposals"""
        status = UserModerationStatus.objects.get_or_create(user=self.user)[0]
        status.is_blocked = True
        status.save()

        decision = self.service.moderate_category_proposal(
            user=self.user, name="Test", description="Test"
        )

        self.assertFalse(decision.is_approved)
        self.assertIn("blocked", decision.rejection_reason.lower())
