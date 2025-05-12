interface LanguageDetectionResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
  possibleLanguages: {
    language: string;
    confidence: number;
  }[];
  modelUsed: 'deepseek' | 'pattern-based';
}

// Language patterns for basic detection
interface LanguagePattern {
  code: string;
  name: string;
  stopWords: string[];
  characterPatterns?: RegExp;
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    code: 'en',
    name: 'English',
    stopWords: ['the', 'is', 'and', 'of', 'to', 'in', 'that', 'it', 'with', 'for', 'as', 'on', 'at', 'by', 'from']
  },
  {
    code: 'es',
    name: 'Spanish',
    stopWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'ser', 'se', 'no', 'por', 'con', 'su', 'para']
  },
  {
    code: 'fr',
    name: 'French',
    stopWords: ['le', 'la', 'de', 'et', 'un', 'une', 'du', 'en', 'que', 'qui', 'à', 'est', 'pour', 'dans', 'ce']
  },
  {
    code: 'de',
    name: 'German',
    stopWords: ['der', 'die', 'das', 'und', 'ist', 'von', 'zu', 'in', 'den', 'mit', 'auf', 'für', 'ein', 'eine']
  },
  {
    code: 'it',
    name: 'Italian',
    stopWords: ['il', 'la', 'di', 'e', 'che', 'a', 'è', 'un', 'in', 'per', 'con', 'su', 'da', 'non']
  },
  {
    code: 'pt',
    name: 'Portuguese',
    stopWords: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os']
  },
  {
    code: 'ru',
    name: 'Russian',
    stopWords: ['и', 'в', 'на', 'с', 'не', 'что', 'по', 'я', 'это', 'быть', 'он', 'как'],
    characterPatterns: /[а-яА-Я]/
  },
  {
    code: 'ja',
    name: 'Japanese',
    stopWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'から'],
    characterPatterns: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/
  },
  {
    code: 'zh',
    name: 'Chinese',
    stopWords: ['的', '是', '在', '了', '和', '有', '我', '不', '这', '人', '你', '个'],
    characterPatterns: /[\u4e00-\u9fff]/
  },
  {
    code: 'ko',
    name: 'Korean',
    stopWords: ['이', '가', '은', '는', '을', '를', '에', '의', '와', '과', '로', '으로'],
    characterPatterns: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/
  },
  {
    code: 'ar',
    name: 'Arabic',
    stopWords: ['في', 'من', 'على', 'هو', 'هي', 'هم', 'ان', 'لا', 'و', 'أن', 'إن', 'كان'],
    characterPatterns: /[\u0600-\u06FF]/
  },
  {
    code: 'hi',
    name: 'Hindi',
    stopWords: ['का', 'के', 'में', 'है', 'की', 'और', 'से', 'को', 'पर', 'इस', 'एक', 'यह'],
    characterPatterns: /[\u0900-\u097F]/
  }
];

/**
 * Detect the language of a text
 */
export async function processLanguageDetection(
  text: string,
  deepseekResult?: string
): Promise<LanguageDetectionResult> {
  // Try to use deepseek result if available
  if (deepseekResult && deepseekResult.trim().length > 0) {
    try {
      const result = deepseekResult.toLowerCase().trim();
      
      // Try to extract language code or name from result
      for (const lang of LANGUAGE_PATTERNS) {
        if (result.includes(lang.code) || result.includes(lang.name.toLowerCase())) {
          return {
            text,
            detectedLanguage: lang.name,
            confidence: 0.9,
            possibleLanguages: [
              { language: lang.name, confidence: 0.9 },
              ...LANGUAGE_PATTERNS
                .filter(l => l.code !== lang.code)
                .map(l => ({ language: l.name, confidence: 0.1 / (LANGUAGE_PATTERNS.length - 1) }))
            ],
            modelUsed: 'deepseek'
          };
        }
      }
    } catch (error) {
      console.error('Error parsing deepseek language detection result:', error);
      // Continue to fallback method
    }
  }
  
  // Fallback to pattern-based detection
  return patternBasedLanguageDetection(text);
}

/**
 * Pattern-based language detection as a fallback method
 */
function patternBasedLanguageDetection(text: string): LanguageDetectionResult {
  // Scores for each language
  const scores: Record<string, number> = {};
  
  // Initialize scores
  LANGUAGE_PATTERNS.forEach(lang => {
    scores[lang.code] = 0;
  });
  
  // Check character patterns first (more reliable for languages with unique scripts)
  for (const lang of LANGUAGE_PATTERNS) {
    if (lang.characterPatterns) {
      const matches = text.match(lang.characterPatterns);
      if (matches && matches.length > 0) {
        scores[lang.code] += matches.length * 2; // Give higher weight to character patterns
      }
    }
  }
  
  // If character patterns gave a strong signal for some languages, prioritize them
  const characterBasedLanguages = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .map(([code]) => code);
  
  const languagesToCheck = characterBasedLanguages.length > 0 
    ? characterBasedLanguages 
    : LANGUAGE_PATTERNS.map(lang => lang.code);
  
  // Tokenize input text (simple word tokenization)
  const words = text.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .split(/\s+/);
  
  // Count stop words for each language
  for (const langCode of languagesToCheck) {
    const lang = LANGUAGE_PATTERNS.find(l => l.code === langCode);
    if (!lang) continue;
    
    for (const word of words) {
      if (lang.stopWords.includes(word)) {
        scores[langCode] += 1;
      }
    }
  }
  
  // Find the language with the highest score
  let maxScore = 0;
  let bestLanguageCode = 'en'; // Default to English if no matches
  
  Object.entries(scores).forEach(([code, score]) => {
    if (score > maxScore) {
      maxScore = score;
      bestLanguageCode = code;
    }
  });
  
  // Get the language name
  const bestLanguage = LANGUAGE_PATTERNS.find(lang => lang.code === bestLanguageCode)?.name || 'Unknown';
  
  // Calculate confidence for each language
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const confidenceScores = LANGUAGE_PATTERNS.map(lang => ({
    language: lang.name,
    confidence: parseFloat((scores[lang.code] / totalScore).toFixed(2)) || 0.01
  }));
  
  // Sort by confidence in descending order
  confidenceScores.sort((a, b) => b.confidence - a.confidence);
  
  return {
    text,
    detectedLanguage: bestLanguage,
    confidence: confidenceScores[0].confidence,
    possibleLanguages: confidenceScores,
    modelUsed: 'pattern-based'
  };
} 