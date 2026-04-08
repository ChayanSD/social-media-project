const MODERATION_KEYWORDS = {
  safety: [
    'kill', 'murder', 'attack', 'bomb', 'weapon', 'gun', 'knife',
    'rape', 'assault', 'abuse', 'torture', 'kidnap', 'threat',
    'suicide', 'self-harm', 'harmful', 'dangerous', 'poison',
  ],
  spam: [
    'click here', 'buy now', 'act now', 'limited time', 'free money',
    'make money', 'work from home', ' earn ', '$$$', 'winner',
    'congratulations', 'you have been selected', 'claim now',
    'discount', 'cheap', 'free gift', 'no obligation', 'act fast',
  ],
};

function checkContentClientSide(text) {
  if (!text || !text.trim()) {
    return { isBlocked: false };
  }

  const textLower = text.toLowerCase();
  const matchedKeywords = [];

  for (const keywords of Object.values(MODERATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }
  }

  if (matchedKeywords.length > 0) {
    return {
      isBlocked: true,
      reason: `Content contains inappropriate keywords: ${matchedKeywords.join(', ')}`,
      matchedKeywords
    };
  }

  return { isBlocked: false };
}

function checkCategoryRelevanceClientSide(name, description = '') {
  const relevantKeywords = [
    'spiritual', 'spirituality', 'metaphysical', 'metaphysics',
    'consciousness', 'conscious', 'esoteric', 'occult', 'mysticism',
    'mystical', 'quantum', 'physics', 'science', 'philosophy',
    'meditation', 'mindfulness', 'awareness', 'awaken', 'awakening',
    'energy', 'chakra', 'astral', 'soul', 'souls', 'afterlife',
    'reincarnation', 'karma', 'zen', 'tao', 'taoism', 'buddhism',
    'psychic', 'intuition', 'intuitive', 'paranormal', 'supernatural',
    'sacred', 'divine', 'cosmic', 'universe', 'dimension', 'dimensions',
    'new age', 'holistic', 'healing', 'law of attraction',
    'manifestation', 'vibration', 'frequency', 'vibrational',
    'tarot', 'astrology', 'numerology', 'runes', 'oracle',
  ];

  const irrelevantKeywords = [
    'politics', 'political', 'sports', 'gaming', 'gamble',
    'recipe', 'cooking', 'fashion', 'beauty', 'makeup',
    'technology', 'tech', 'software', 'hardware', 'programming',
    'business', 'marketing', 'finance', 'investment', 'stock',
    'crypto', 'cryptocurrency', 'bitcoin', 'nft',
  ];

  const combinedText = `${name} ${description}`.toLowerCase();

  const relevantMatches = relevantKeywords.filter(k => 
    combinedText.includes(k.toLowerCase())
  );
  const irrelevantMatches = irrelevantKeywords.filter(k => 
    combinedText.includes(k.toLowerCase())
  );

  if (relevantMatches.length > 0 && irrelevantMatches.length === 0) {
    return { isRelevant: true };
  }
  if (irrelevantMatches.length > 0 && relevantMatches.length === 0) {
    return { 
      isRelevant: false, 
      reason: 'Category is not related to the forum theme' 
    };
  }

  return { 
    isRelevant: false, 
    reason: 'Category could not be verified for relevance' 
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkContentClientSide,
    checkCategoryRelevanceClientSide,
    MODERATION_KEYWORDS
  };
}
