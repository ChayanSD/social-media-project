import os
import logging
import time
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


MODERATION_TIMEOUT = 5


@dataclass
class ModerationResult:
    is_flagged: bool
    violation_type: Optional[str] = None
    categories: Dict[str, bool] = None
    category_scores: Dict[str, float] = None
    model: Optional[str] = None
    error: Optional[str] = None

    def __post_init__(self):
        if self.categories is None:
            self.categories = {}
        if self.category_scores is None:
            self.category_scores = {}


class OpenAIModerationAdapter:
    """
    Adapter for OpenAI Moderation API.
    Isolated behind a service interface for easy tuning later.
    """

    def __init__(self, api_key: str = None, timeout: int = MODERATION_TIMEOUT):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.timeout = timeout
        self.base_url = "https://api.openai.com/v1/moderations"
        self.model = "text-moderation-007"

    def moderate_text(self, text: str) -> ModerationResult:
        """
        Check text content using OpenAI Moderation API.

        Args:
            text: The text content to check

        Returns:
            ModerationResult with flagged status and details
        """
        if not text or not text.strip():
            return ModerationResult(is_flagged=False)

        if not self.api_key:
            logger.warning("OpenAI API key not configured, skipping AI moderation")
            return ModerationResult(
                is_flagged=False, error="Moderation service not configured"
            )

        start_time = time.time()
        text_preview = (text[:100] + "...") if len(text) > 100 else text
        logger.info(f"MODERATION: Sending request to OpenAI - Content: \"{text_preview}\"")

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            payload = {"input": text}

            response = requests.post(
                self.base_url, headers=headers, json=payload, timeout=self.timeout
            )
            
            duration = time.time() - start_time

            if response.status_code == 200:
                result = response.json()
                parsed = self._parse_response(result)
                
                status_msg = "FLAGGED" if parsed.is_flagged else "CLEAN"
                violation_info = f" ({parsed.violation_type})" if parsed.violation_type else ""
                logger.info(f"MODERATION: Result: {status_msg}{violation_info} - Duration: {duration:.2f}s")
                
                return parsed
            elif response.status_code == 429:
                logger.warning(f"MODERATION: Rate limited by OpenAI - Duration: {duration:.2f}s")
                return ModerationResult(
                    is_flagged=False, error="Rate limited - allowing content"
                )
            elif response.status_code >= 500:
                logger.error(f"MODERATION: API Error {response.status_code} - Duration: {duration:.2f}s")
                return ModerationResult(
                    is_flagged=False,
                    error="Moderation service unavailable - allowing content",
                )
            else:
                logger.error(
                    f"MODERATION: Error {response.status_code} - {response.text} - Duration: {duration:.2f}s"
                )
                return ModerationResult(
                    is_flagged=False,
                    error=f"Moderation API error: {response.status_code}",
                )

        except requests.Timeout:
            duration = time.time() - start_time
            logger.warning(f"MODERATION: Request timed out after {duration:.2f}s")
            return ModerationResult(
                is_flagged=False, error="Moderation timeout - allowing content"
            )
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"MODERATION: Unexpected error: {str(e)} - Duration: {duration:.2f}s")
            return ModerationResult(
                is_flagged=False, error="Moderation service error - allowing content"
            )


    def _parse_response(self, result: dict) -> ModerationResult:
        """Parse the OpenAI moderation API response"""
        try:
            results = result.get("results", [])
            if not results:
                return ModerationResult(is_flagged=False)

            result_data = results[0]

            flagged = result_data.get("flagged", False)
            categories = result_data.get("categories", {})
            category_scores = result_data.get("category_scores", {})
            model = result_data.get("model", self.model)

            violation_type = None
            if flagged:
                for category, is_flagged in categories.items():
                    if is_flagged:
                        if violation_type is None:
                            violation_type = category
                        else:
                            violation_type += f", {category}"

            return ModerationResult(
                is_flagged=flagged,
                violation_type=violation_type,
                categories=categories,
                category_scores=category_scores,
                model=model,
            )

        except Exception as e:
            logger.error(f"Error parsing moderation response: {str(e)}")
            return ModerationResult(
                is_flagged=False, error="Failed to parse moderation response"
            )


    def check_theme_relevance(self, name: str, description: str = "") -> Tuple[bool, Optional[str]]:
        """
        Check if a category/subcategory is relevant to the forum's theme using GPT.
        Theme: Spirituality, Metaphysics, Consciousness, Quantum Science, Philosophy.
        """
        if not self.api_key:
            return True, None # Allow if not configured

        start_time = time.time()
        prompt = (
            "You are a moderator for a social media platform focused on Spirituality, Metaphysics, Consciousness, Quantum Science, and Philosophy.\n"
            f"Determine if the following category proposal is relevant to these themes.\n\n"
            f"Category Name: {name}\n"
            f"Description: {description}\n\n"
            "Return JSON format: {\"is_relevant\": boolean, \"reason\": \"brief explanation why or why not\"}"
        )

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
                "max_tokens": 100
            }

            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=8
            )
            
            duration = time.time() - start_time

            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                import json
                parsed = json.loads(content)
                
                is_relevant = parsed.get("is_relevant", True)
                reason = parsed.get("reason") if not is_relevant else None
                
                status_msg = "RELEVANT" if is_relevant else "IRRELEVANT"
                logger.info(f"THEME CHECK: Result: {status_msg} - Duration: {duration:.2f}s")
                
                return is_relevant, reason
            else:
                logger.error(f"THEME CHECK: API Error {response.status_code}")
                return True, None # Default to allow on error
                
        except Exception as e:
            logger.error(f"THEME CHECK: Error: {str(e)}")
            return True, None


openai_moderation = OpenAIModerationAdapter()

