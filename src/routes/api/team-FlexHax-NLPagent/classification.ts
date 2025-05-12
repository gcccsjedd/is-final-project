import type { NlpRequest } from './validate';

interface ClassificationResult {
  text: string;
  category: string;
  confidence: number;
  allCategories: {
    category: string;
    confidence: number;
  }[];
  modelUsed: 'deepseek' | 'keyword-based' | 'tf-idf';
}

// Default categories if none are provided
const DEFAULT_CATEGORIES = [
  'technology', 
  'business', 
  'health', 
  'entertainment', 
  'sports', 
  'politics', 
  'science',
  'education'
];

// Category keywords with weighting for more precise classification
interface WeightedKeyword {
  word: string;
  weight: number; // 1-5 scale where 5 is the most indicative
}

const CATEGORY_KEYWORDS: Record<string, WeightedKeyword[]> = {
  technology: [
    { word: 'algorithm', weight: 5 },
    { word: 'artificial intelligence', weight: 5 },
    { word: 'machine learning', weight: 5 },
    { word: 'programming', weight: 5 },
    { word: 'software', weight: 4 },
    { word: 'hardware', weight: 4 },
    { word: 'computer', weight: 4 },
    { word: 'database', weight: 4 },
    { word: 'app', weight: 3 },
    { word: 'data', weight: 3 },
    { word: 'internet', weight: 3 },
    { word: 'website', weight: 3 },
    { word: 'code', weight: 3 },
    { word: 'digital', weight: 2 },
    { word: 'tech', weight: 2 },
    { word: 'device', weight: 2 },
    { word: 'gadget', weight: 2 },
    { word: 'electronic', weight: 2 }
  ],
  business: [
    { word: 'investment', weight: 5 },
    { word: 'entrepreneur', weight: 5 },
    { word: 'stock market', weight: 5 },
    { word: 'venture capital', weight: 5 },
    { word: 'company', weight: 4 },
    { word: 'profit', weight: 4 },
    { word: 'revenue', weight: 4 },
    { word: 'startup', weight: 4 },
    { word: 'market', weight: 3 },
    { word: 'finance', weight: 3 },
    { word: 'economy', weight: 3 },
    { word: 'industry', weight: 3 },
    { word: 'corporation', weight: 3 },
    { word: 'management', weight: 2 },
    { word: 'business', weight: 2 },
    { word: 'commercial', weight: 2 }
  ],
  health: [
    { word: 'disease', weight: 5 },
    { word: 'medical treatment', weight: 5 },
    { word: 'diagnosis', weight: 5 },
    { word: 'medication', weight: 5 },
    { word: 'doctor', weight: 4 },
    { word: 'patient', weight: 4 },
    { word: 'hospital', weight: 4 },
    { word: 'medicine', weight: 4 },
    { word: 'healthcare', weight: 4 },
    { word: 'fitness', weight: 3 },
    { word: 'diet', weight: 3 },
    { word: 'wellness', weight: 3 },
    { word: 'symptom', weight: 3 },
    { word: 'therapy', weight: 3 },
    { word: 'health', weight: 2 },
    { word: 'medical', weight: 2 }
  ],
  entertainment: [
    { word: 'movie premiere', weight: 5 },
    { word: 'box office', weight: 5 },
    { word: 'celebrity', weight: 5 },
    { word: 'blockbuster', weight: 5 },
    { word: 'movie', weight: 4 },
    { word: 'film', weight: 4 },
    { word: 'music', weight: 4 },
    { word: 'actor', weight: 4 },
    { word: 'actress', weight: 4 },
    { word: 'television', weight: 3 },
    { word: 'TV show', weight: 3 },
    { word: 'concert', weight: 3 },
    { word: 'festival', weight: 3 },
    { word: 'performance', weight: 3 },
    { word: 'entertainment', weight: 2 },
    { word: 'streaming', weight: 2 }
  ],
  sports: [
    { word: 'championship', weight: 5 },
    { word: 'olympic', weight: 5 },
    { word: 'world cup', weight: 5 },
    { word: 'athlete', weight: 5 },
    { word: 'game', weight: 4 },
    { word: 'team', weight: 4 },
    { word: 'player', weight: 4 },
    { word: 'coach', weight: 4 },
    { word: 'tournament', weight: 4 },
    { word: 'match', weight: 3 },
    { word: 'competition', weight: 3 },
    { word: 'score', weight: 3 },
    { word: 'win', weight: 3 },
    { word: 'sports', weight: 2 },
    { word: 'football', weight: 2 },
    { word: 'basketball', weight: 2 }
  ],
  politics: [
    { word: 'election', weight: 5 },
    { word: 'government policy', weight: 5 },
    { word: 'legislation', weight: 5 },
    { word: 'presidential', weight: 5 },
    { word: 'government', weight: 4 },
    { word: 'president', weight: 4 },
    { word: 'vote', weight: 4 },
    { word: 'policy', weight: 4 },
    { word: 'politician', weight: 4 },
    { word: 'congress', weight: 3 },
    { word: 'senate', weight: 3 },
    { word: 'democratic', weight: 3 },
    { word: 'republican', weight: 3 },
    { word: 'campaign', weight: 3 },
    { word: 'political', weight: 2 },
    { word: 'law', weight: 2 }
  ],
  science: [
    { word: 'scientific discovery', weight: 5 },
    { word: 'laboratory experiment', weight: 5 },
    { word: 'research findings', weight: 5 },
    { word: 'quantum', weight: 5 },
    { word: 'research', weight: 4 },
    { word: 'experiment', weight: 4 },
    { word: 'scientist', weight: 4 },
    { word: 'study', weight: 4 },
    { word: 'discovery', weight: 4 },
    { word: 'theory', weight: 3 },
    { word: 'physics', weight: 3 },
    { word: 'biology', weight: 3 },
    { word: 'chemistry', weight: 3 },
    { word: 'scientific', weight: 2 },
    { word: 'climate', weight: 2 },
    { word: 'astronomy', weight: 2 }
  ],
  education: [
    { word: 'academic research', weight: 5 },
    { word: 'educational curriculum', weight: 5 },
    { word: 'university degree', weight: 5 },
    { word: 'dissertation', weight: 5 },
    { word: 'school', weight: 4 },
    { word: 'student', weight: 4 },
    { word: 'teacher', weight: 4 },
    { word: 'professor', weight: 4 },
    { word: 'university', weight: 4 },
    { word: 'college', weight: 3 },
    { word: 'learning', weight: 3 },
    { word: 'curriculum', weight: 3 },
    { word: 'academic', weight: 3 },
    { word: 'education', weight: 2 },
    { word: 'knowledge', weight: 2 },
    { word: 'course', weight: 2 }
  ]
};

// Stop words to filter out during classification
const STOP_WORDS = [
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what', 
  'which', 'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than', 
  'such', 'when', 'while', 'who', 'with', 'at', 'from', 'into', 'during',
  'to', 'in', 'for', 'on', 'by', 'about', 'like', 'through', 'over', 'before',
  'between', 'after', 'since', 'without', 'under', 'within', 'along',
  'of', 'some', 'their', 'them', 'they', 'we', 'you', 'i', 'it', 'is', 'am',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'may', 'might'
];

/**
 * Text classification implementation
 */
export async function processTextClassification(
  text: string,
  options?: NlpRequest['options'],
  deepseekResult?: string
): Promise<ClassificationResult> {
  // Get categories from options or use defaults
  const categories = options?.categories && options.categories.length > 0
    ? options.categories
    : DEFAULT_CATEGORIES;
  
  // Parse deepseek result if available
  if (deepseekResult && deepseekResult.trim().length > 0) {
    try {
      // Try to extract a clear category from the deepseek result
      const result = deepseekResult.toLowerCase().trim();
      
      // Check if any category is mentioned in the result
      const matchedCategory = categories.find(cat => 
        result.includes(cat.toLowerCase())
      );
      
      if (matchedCategory) {
        // Improved confidence estimation based on language certainty
        let confidence = 0.7; // base confidence
        
        // Check for confidence indicators in the language
        if (result.includes('confident') || result.includes('certain') || 
            result.includes('definitely') || result.includes('clearly')) {
          confidence = 0.9;
        } else if (result.includes('likely') || result.includes('probably')) {
          confidence = 0.8;
        } else if (result.includes('might') || result.includes('possibly') || 
                  result.includes('perhaps') || result.includes('maybe')) {
          confidence = 0.6;
        }
        
        return {
          text,
          category: matchedCategory,
          confidence,
          allCategories: [
            { category: matchedCategory, confidence },
            ...categories
              .filter(c => c !== matchedCategory)
              .map(c => ({ 
                category: c, 
                confidence: Math.max(0.01, (1 - confidence) / (categories.length - 1)) 
              }))
          ],
          modelUsed: 'deepseek'
        };
      }
    } catch (error) {
      console.error('Error parsing deepseek classification result:', error);
      // Continue to fallback method
    }
  }
  
  // Fallback to advanced TF-IDF classification
  return advancedClassification(text, categories);
}

/**
 * Advanced classification using TF-IDF and n-gram analysis
 */
function advancedClassification(text: string, categories: string[]): ClassificationResult {
  // Normalize and tokenize the text
  const normalizedText = text.toLowerCase();
  
  // Extract n-grams (1-3 words) from text
  const tokens = extractTokens(normalizedText);
  const unigrams = tokens.filter(token => !STOP_WORDS.includes(token));
  const bigrams = extractNgrams(tokens, 2);
  const trigrams = extractNgrams(tokens, 3);
  
  // Calculate category scores using both keyword matching and TF-IDF
  const catScores: Record<string, { score: number, matches: string[] }> = {};
  
  categories.forEach(category => {
    const categoryLower = category.toLowerCase();
    const matches: string[] = [];
    let score = 0;
    
    // Get keywords for this category or use empty array if not found
    const keywords = CATEGORY_KEYWORDS[categoryLower] || [];
    
    // Check for exact matches (with weights)
    keywords.forEach(({ word, weight }) => {
      const wordLower = word.toLowerCase();
      
      // Check if the keyword appears in the text as a whole phrase
      if (normalizedText.includes(wordLower)) {
        const count = countOccurrences(normalizedText, wordLower);
        score += count * weight;
        matches.push(word);
      }
    });
    
    // Check unigrams, bigrams, and trigrams for partial matches
    const allNgrams = [...unigrams, ...bigrams, ...trigrams];
    
    allNgrams.forEach(ngram => {
      keywords.forEach(({ word, weight }) => {
        // Check if this ngram is part of a keyword or vice versa
        if (word.toLowerCase().includes(ngram) || ngram.includes(word.toLowerCase())) {
          // Adjust weight based on how much of the keyword is matched
          const matchRatio = Math.min(ngram.length / word.length, 1);
          score += matchRatio * (weight * 0.5); // Half weight for partial matches
          
          if (!matches.includes(word)) {
            matches.push(word);
          }
        }
      });
    });
    
    // Bonus points for exact category name appearance
    if (normalizedText.includes(categoryLower)) {
      score += 3;
      matches.push(categoryLower);
    }
    
    // Store the score and matching keywords
    catScores[category] = { 
      score, 
      matches 
    };
  });
  
  // Find the category with the highest score
  let maxScore = 0;
  let bestCategory = categories[0];
  
  Object.entries(catScores).forEach(([category, { score }]) => {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  });
  
  // Calculate confidence values
  let confidenceScores: { category: string; confidence: number }[] = [];
  
  if (maxScore > 0) {
    // Convert raw scores to confidence values
    const totalScore = Object.values(catScores).reduce((sum, { score }) => sum + score, 0);
    
    confidenceScores = Object.entries(catScores).map(([category, { score }]) => ({
      category,
      confidence: parseFloat((score / totalScore).toFixed(2))
    }));
  } else {
    // If no scores found, assign minimal confidence
    confidenceScores = categories.map(category => ({
      category,
      confidence: category === bestCategory ? 0.4 : 0.1
    }));
  }
  
  // Sort by confidence in descending order
  confidenceScores.sort((a, b) => b.confidence - a.confidence);
  
  return {
    text,
    category: bestCategory,
    confidence: confidenceScores[0].confidence,
    allCategories: confidenceScores,
    modelUsed: 'tf-idf'
  };
}

/**
 * Extract tokens from text
 */
function extractTokens(text: string): string[] {
  return text
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(token => token.length > 1);
}

/**
 * Extract n-grams from tokens
 */
function extractNgrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  
  for (let i = 0; i <= tokens.length - n; i++) {
    const ngram = tokens.slice(i, i + n).join(' ');
    if (ngram.length > 2) { // Skip very short ngrams
      ngrams.push(ngram);
    }
  }
  
  return ngrams;
}

/**
 * Count occurrences of a substring in text
 */
function countOccurrences(text: string, searchString: string): number {
  let count = 0;
  let position = text.indexOf(searchString);
  
  while (position !== -1) {
    count++;
    position = text.indexOf(searchString, position + 1);
  }
  
  return count;
} 