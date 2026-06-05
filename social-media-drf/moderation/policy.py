from dataclasses import dataclass
from typing import List, Optional, Tuple
import re
import logging

logger = logging.getLogger(__name__)


VIOLATION_KEYWORDS = {
    "safety": [
        "kill",
        "murder",
        "attack",
        "bomb",
        "weapon",
        "gun",
        "knife",
        "rape",
        "assault",
        "abuse",
        "torture",
        "kidnap",
        "threat",
        "suicide",
        "self-harm",
        "harmful",
        "dangerous",
        "poison",
    ],
    "spam": [
        "click here",
        "buy now",
        "act now",
        "limited time",
        "free money",
        "make money",
        "work from home",
        " earn ",
        "$$$",
        "winner",
        "congratulations",
        "you have been selected",
        "claim now",
        "discount",
        "cheap",
        "free gift",
        "no obligation",
        "act fast",
    ],
    "profanity": [
        "fuck",
        "shit",
        "bitch",
        "cunt",
        "asshole",
        "motherfucker",
        "dick",
        "pussy",
        "whore",
        "slut"
    ],
}

SAFE_WORDS_THAT_CONTAIN_BANNED: List[str] = [
    "skill",
    "skills",
    "grapes",
    "grape",
    "begun",
    "bulletin",
    "bullet",
    "basket",
    "bask",
    "darkroom",
    "dark",
    "gunn",
    "gunner",
    "hanged",
    "hang",
    "killer",
    "killing",
    "massacre",
    "massac",
    "matches",
    "match",
    "mortgage",
    "mort",
    "needles",
    "needless",
    "needle",
    "passed",
    "pass",
    "podcast",
    "pod",
    "printer",
    "print",
    "program",
    "programs",
    "programming",
    "ranger",
    "range",
    "rated",
    "rate",
    "recital",
    "recite",
    "rejects",
    "reject",
    "reset",
    "resets",
    "school",
    "schools",
    "shells",
    "shell",
    "shooter",
    "shoot",
    "shredder",
    "shred",
    "sniper",
    "snipe",
    "spear",
    "spears",
    "stabs",
    "stabbing",
    "stab",
    "stalker",
    "stalk",
    "strangled",
    "strangle",
    "taser",
    "tase",
    "tranquilizer",
    "tranquil",
    "triggered",
    "trigger",
    "weed",
    "weeds",
    "suicide prevention",
    "suicide prevention resources",
]


@dataclass
class KeywordFilterResult:
    is_blocked: bool
    violation_type: Optional[str] = None
    matched_keywords: Optional[List[str]] = None
    reason: Optional[str] = None

    def __post_init__(self):
        if self.matched_keywords is None:
            self.matched_keywords = []


def _normalize_text(text: str) -> str:
    """Normalize text for matching - handle obfuscation attempts"""
    text = text.lower()
    text = re.sub(r"[\s\-_]+", "", text)
    text = re.sub(r"[!@#$%^&*()+=]+", "", text)
    text = re.sub(r"(\w)\1{2,}", r"\1\1", text)
    text = re.sub(r"(\w)0(\w)", r"\1o\2", text)
    text = re.sub(r"(\w)1(\w)", r"\1i\2", text)
    text = re.sub(r"(\w)4(\w)", r"\1a\2", text)
    text = re.sub(r"(\w)3(\w)", r"\1e\2", text)
    text = re.sub(r"(\w)5(\w)", r"\1s\2", text)
    return text


def _is_word_boundary_match(text: str, keyword: str) -> bool:
    """Check if keyword matches at word boundaries only"""
    pattern = r"\b" + re.escape(keyword) + r"\b"
    return bool(re.search(pattern, text.lower()))


def _check_safe_word_overlap(text: str, keyword: str) -> bool:
    """Check if the matched keyword is part of a known safe word"""
    text_lower = text.lower()
    for safe_word in SAFE_WORDS_THAT_CONTAIN_BANNED:
        if safe_word in text_lower and keyword in safe_word:
            return True
    return False


class KeywordFilter:
    """
    Client-side and server-side keyword filter for content moderation.
    Runs first in the moderation pipeline to save latency/cost.
    """

    def __init__(self):
        self.violation_keywords = VIOLATION_KEYWORDS
        self.safe_words = SAFE_WORDS_THAT_CONTAIN_BANNED
        self._compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> dict:
        """Pre-compile regex patterns for performance"""
        patterns = {}
        for vtype, keywords in self.violation_keywords.items():
            patterns[vtype] = []
            for keyword in keywords:
                pattern = r"\b" + re.escape(keyword) + r"\b"
                patterns[vtype].append((keyword, re.compile(pattern, re.IGNORECASE)))
        return patterns

    def check_content(
        self, text: str, content_type: str = "general"
    ) -> KeywordFilterResult:
        """
        Check text content against keyword filters.

        Args:
            text: The text content to check
            content_type: Type of content ('chat', 'post', 'comment', 'category')

        Returns:
            KeywordFilterResult with blocking decision
        """
        if not text or not text.strip():
            return KeywordFilterResult(is_blocked=False)

        text_lower = text.lower()
        words = text_lower.split()

        if len(words) <= 2 and len(text.strip()) < 5:
            return KeywordFilterResult(is_blocked=False)

        matched_keywords = []
        violation_type = None

        for vtype, keyword_patterns in self._compiled_patterns.items():
            for keyword, pattern in keyword_patterns:
                match = pattern.search(text_lower)
                if match:
                    if self._check_false_positive(text, keyword):
                        continue
                    matched_keywords.append(keyword)
                    if violation_type is None:
                        violation_type = vtype

        if matched_keywords:
            reason = f"Content contains inappropriate keywords: {', '.join(matched_keywords)}"
            return KeywordFilterResult(
                is_blocked=True,
                violation_type=violation_type,
                matched_keywords=matched_keywords,
                reason=reason,
            )

        return KeywordFilterResult(is_blocked=False)

    def _check_false_positive(self, text: str, keyword: str) -> bool:
        """Check if the keyword match is a false positive"""
        text_lower = text.lower()

        if _check_safe_word_overlap(text_lower, keyword):
            return True

        if "'" in text or '"' in text:
            quoted_pattern = r'["\']([^"\']*' + re.escape(keyword) + r'[^"\']*)["\']'
            if re.search(quoted_pattern, text_lower):
                return True

        words_in_quotes = re.findall(r'["\']([^"\']+)["\']', text_lower)
        for word in words_in_quotes:
            if keyword in word:
                return True

        return False

    def check_category_relevance(
        self, name: str, description: str = ""
    ) -> Tuple[bool, Optional[str], dict]:
        """
        Check if a category proposal is relevant to the forum theme.
        Forum theme: spirituality, metaphysical subjects, consciousness,
        esoteric topics, quantum-science-adjacent discussion.

        Returns:
            Tuple of (is_relevant, rejection_reason, confidence_scores)
        """
        relevant_keywords = [
            "spiritual",
            "spirituality",
            "metaphysical",
            "metaphysics",
            "consciousness",
            "conscious",
            "esoteric",
            "occult",
            "mysticism",
            "mystical",
            "quantum",
            "physics",
            "science",
            "philosophy",
            "meditation",
            "mindfulness",
            "awareness",
            "awaken",
            "awakening",
            "energy",
            "chakra",
            "astral",
            "soul",
            "souls",
            " afterlife",
            "reincarnation",
            "karma",
            "zen",
            "tao",
            "taoism",
            "buddhism",
            "psychic",
            "intuition",
            "intuitive",
            "paranormal",
            "supernatural",
            "sacred",
            "divine",
            "cosmic",
            "universe",
            "dimension",
            "dimensions",
            "new age",
            "holistic",
            "healing",
            "law of attraction",
            "manifestation",
            "vibration",
            "frequency",
            "vibrational",
            "tarot",
            "astrology",
            "numerology",
            "runes",
            "oracle",
            "ritual",
            "ceremony",
            "spell",
            "magick",
            "magic",
            "wicca",
            "pagan",
            "shaman",
            "shamanic",
            "totem",
            "spirit guide",
            "near death",
            "nde",
            "out of body",
            "astral projection",
            "remote viewing",
            "psychic ability",
            "psi",
            "telepathy",
            "clairvoyance",
            "clairsentience",
            "medium",
            "mediumship",
            "afterlife",
            "heaven",
            "hell",
            "underworld",
            "shadow",
            "archetype",
            "collective unconscious",
            "psyche",
            "depth psychology",
            "synchronistic",
            "synchronicity",
            "Carl Jung",
            "jungian",
            "wave function",
            "observer effect",
            "entanglement",
            "multiverse",
            "parallel universe",
            "string theory",
            "dark matter",
            "dark energy",
            "cosmology",
            "cosmological",
        ]

        irrelevant_keywords = [
            "politics",
            "political",
            "sports",
            "gaming",
            "gamble",
            "recipe",
            "cooking",
            "fashion",
            "beauty",
            "makeup",
            "technology",
            "tech",
            "software",
            "hardware",
            "programming",
            "business",
            "marketing",
            "finance",
            "investment",
            "stock",
            "crypto",
            "cryptocurrency",
            "bitcoin",
            "nft",
            "real estate",
            "property",
            "car",
            "vehicle",
            "news",
            "celebrity",
            "entertainment",
            "movie",
            "music",
            "weather",
            "travel",
            "vacation",
            "hotel",
        ]

        combined_text = f"{name} {description}".lower()

        relevant_matches = []
        irrelevant_matches = []

        for keyword in relevant_keywords:
            if keyword.lower() in combined_text:
                relevant_matches.append(keyword)

        for keyword in irrelevant_keywords:
            if keyword.lower() in combined_text:
                irrelevant_matches.append(keyword)

        confidence = {
            "relevant_score": len(relevant_matches) / max(len(relevant_keywords), 1),
            "irrelevant_score": len(irrelevant_matches)
            / max(len(irrelevant_keywords), 1),
            "relevant_matches": relevant_matches,
            "irrelevant_matches": irrelevant_matches,
        }

        if len(relevant_matches) > 0 and len(irrelevant_matches) == 0:
            return True, None, confidence

        if len(irrelevant_matches) > 0 and len(relevant_matches) == 0:
            return (
                False,
                "Category is not related to the forum theme (spirituality, metaphysics, consciousness, quantum science, etc.)",
                confidence,
            )

        if len(relevant_matches) == 0 and len(irrelevant_matches) == 0:
            return (
                False,
                "Category could not be verified for relevance. Please ensure your proposal is related to spirituality, metaphysics, consciousness, or quantum-science-adjacent topics.",
                confidence,
            )

        if len(relevant_matches) >= len(irrelevant_matches):
            return True, None, confidence
        else:
            return False, "Category appears unrelated to the forum theme.", confidence

    def is_user_blocked(self, user) -> bool:
        """Check if a user is blocked from posting"""
        if not hasattr(user, "moderation_status"):
            return False
        return user.moderation_status.is_blocked

    def get_user_warning_count(self, user) -> int:
        """Get user's current warning count"""
        if not hasattr(user, "moderation_status"):
            return 0
        return user.moderation_status.warning_count


keyword_filter = KeywordFilter()
