import type { NlpRequest } from './validate';

interface KeywordExtractionResult {
  text: string;
  keywords: {
    keyword: string;
    score: number;
  }[];
  modelUsed: 'deepseek' | 'tfidf';
}

// List of stopwords to exclude from keyword extraction
const STOPWORDS = [
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
  'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves', 'also', 'like', 'get', 'use', 'even', 'may', 'many',
  'much', 'well', 'way', 'however', 'therefore', 'thus', 'since', 'without',
  'within', 'among', 'around', 'despite', 'though', 'although'
];

// Common words that might be part of important phrases despite being stopwords
const PHRASE_EXCEPTIONS = [
  'artificial intelligence', 'machine learning', 'deep learning', 'natural language',
  'computer vision', 'big data', 'neural network', 'internet of things',
  'virtual reality', 'augmented reality', 'cloud computing'
];

/**
 * Extract keywords from text
 */
export async function processKeywordExtraction(
  text: string, 
  options?: NlpRequest['options'],
  deepseekResult?: string
): Promise<KeywordExtractionResult> {
  // Set the number of keywords to extract
  const keywordCount = options?.keywordCount || 5;
  
  // Try to use deepseek result if available
  if (deepseekResult && deepseekResult.trim().length > 0) {
    try {
      const result = deepseekResult.trim();
      
      // Try to parse keywords from deepseek result
      // Assuming deepseek returns a comma or newline separated list of keywords
      const keywordList = result
        .split(/,|\n/)
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, keywordCount);
      
      if (keywordList.length > 0) {
        // Assign decreasing scores to keywords based on position
        const keywords = keywordList.map((keyword, index) => ({
          keyword,
          score: parseFloat((1 - index * (0.7 / keywordList.length)).toFixed(2))
        }));
        
        return {
          text,
          keywords,
          modelUsed: 'deepseek'
        };
      }
    } catch (error) {
      console.error('Error parsing deepseek keyword extraction result:', error);
      // Continue to fallback method
    }
  }
  
  // Fallback to enhanced TF-IDF based keyword extraction
  return enhancedKeywordExtraction(text, keywordCount);
}

/**
 * Extract keywords using an enhanced TF-IDF approach with N-gram support
 */
function enhancedKeywordExtraction(text: string, keywordCount: number): KeywordExtractionResult {
  // Preserve common phrases that might be important
  let processedText = text;
  const preservedPhrases: Record<string, string> = {};
  
  // Replace known phrases with placeholders to keep them together
  PHRASE_EXCEPTIONS.forEach((phrase, idx) => {
    const placeholder = `__PHRASE_${idx}__`;
    const regex = new RegExp(phrase, 'gi');
    if (regex.test(processedText)) {
      preservedPhrases[placeholder] = phrase;
      processedText = processedText.replace(regex, placeholder);
    }
  });
  
  // Clean and tokenize the text
  const cleanText = processedText.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')  // Keep apostrophes and hyphens
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split the text into sentences for document frequency analysis
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .filter(s => s.trim().length > 0);
  
  // Extract n-grams (unigrams, bigrams, trigrams)
  const extractNGrams = (text: string, n: number): string[] => {
    const words = text.split(' ').filter(w => w.length > 0);
    if (words.length < n) return [];
    
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ');
      ngrams.push(ngram);
    }
    return ngrams;
  };
  
  // Extract all potential keywords (n-grams)
  const unigrams = cleanText.split(' ')
    .filter(word => 
      word.length > 2 && 
      !STOPWORDS.includes(word) && 
      !/^\d+$/.test(word) &&
      !Object.keys(preservedPhrases).includes(word)
    );
  
  const bigrams = extractNGrams(cleanText, 2)
    .filter(bigram => {
      const [first, second] = bigram.split(' ');
      // Keep bigrams where at least one word is not a stopword
      return (!STOPWORDS.includes(first) || !STOPWORDS.includes(second));
    });
  
  const trigrams = extractNGrams(cleanText, 3)
    .filter(trigram => {
      const words = trigram.split(' ');
      // Keep trigrams with at least one non-stopword
      return words.some(w => !STOPWORDS.includes(w));
    });
  
  // Add preserved phrases back as potential keywords
  const specialPhrases = Object.keys(preservedPhrases).map(key => preservedPhrases[key]);
  
  // Combine all potential keywords
  const potentialKeywords = [...unigrams, ...bigrams, ...trigrams, ...specialPhrases];
  
  // Calculate term frequency
  const termFreq: Record<string, number> = {};
  potentialKeywords.forEach(term => {
    termFreq[term] = (termFreq[term] || 0) + 1;
  });
  
  // Calculate document frequency (how many sentences contain each term)
  const docFreq: Record<string, number> = {};
  const totalDocs = sentences.length;
  
  potentialKeywords.forEach(term => {
    if (!docFreq[term]) {
      // Count how many sentences contain this term
      let count = 0;
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        if (lowerSentence.includes(term)) {
          count++;
        }
      });
      docFreq[term] = count;
    }
  });
  
  // Calculate TF-IDF scores with additional weighting factors
  const tfIdfScores: {keyword: string; score: number}[] = Object.keys(termFreq).map(term => {
    // Base TF-IDF calculation
    const tf = termFreq[term] / potentialKeywords.length;
    const idf = Math.log((totalDocs + 1) / (docFreq[term] + 1)) + 1;
    let score = tf * idf;
    
    // Apply length bonus for multi-word terms (higher weight for compound terms)
    const wordCount = term.split(' ').length;
    const lengthMultiplier = wordCount > 1 ? 1.0 + (wordCount - 1) * 0.2 : 1.0;
    
    // Apply position bonus (terms appearing at the beginning get higher scores)
    let positionBonus = 1.0;
    const firstSentence = sentences[0]?.toLowerCase() || '';
    if (firstSentence.includes(term)) {
      positionBonus = 1.3;
    }
    
    // Apply special phrase bonus
    const phraseBonus = specialPhrases.includes(term) ? 1.5 : 1.0;
    
    // Combine all factors
    score = score * lengthMultiplier * positionBonus * phraseBonus;
    
    return {
      keyword: term,
      score
    };
  });
  
  // Sort by score and take top N
  tfIdfScores.sort((a, b) => b.score - a.score);
  
  // Remove duplicates and substrings (e.g., if "artificial intelligence" is selected,
  // don't include "artificial" or "intelligence" separately)
  const filteredKeywords: {keyword: string; score: number}[] = [];
  
  for (const item of tfIdfScores) {
    // Skip if we already have enough keywords
    if (filteredKeywords.length >= keywordCount) break;
    
    // Check if this term is a substring of any already selected term
    const isSubstring = filteredKeywords.some(selected => 
      selected.keyword.includes(item.keyword) || item.keyword.includes(selected.keyword)
    );
    
    if (!isSubstring) {
      filteredKeywords.push(item);
    }
  }
  
  // Ensure we have enough keywords by adding more if needed
  const remainingKeywords = keywordCount - filteredKeywords.length;
  if (remainingKeywords > 0) {
    const additionalKeywords = tfIdfScores
      .filter(item => !filteredKeywords.some(k => k.keyword === item.keyword))
      .slice(0, remainingKeywords);
    
    filteredKeywords.push(...additionalKeywords);
  }
  
  // Normalize scores to 0-1 range
  const maxScore = filteredKeywords.length > 0 ? 
    Math.max(...filteredKeywords.map(k => k.score)) : 1;
  
  const normalizedKeywords = filteredKeywords
    .slice(0, keywordCount)
    .map(item => ({
      keyword: item.keyword,
      score: parseFloat((item.score / maxScore).toFixed(2))
    }));
  
  return {
    text,
    keywords: normalizedKeywords,
    modelUsed: 'tfidf'
  };
} 