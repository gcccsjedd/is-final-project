interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  modelUsed: 'deepseek' | 'rule-based';
}

// Enhanced word lists with strength indicators
interface SentimentWord {
  word: string;
  weight: number; // 1-5 scale where 5 is strongest
}

const POSITIVE_WORDS: SentimentWord[] = [
  // Strong positive words (weight 5)
  { word: 'excellent', weight: 5 },
  { word: 'amazing', weight: 5 },
  { word: 'outstanding', weight: 5 },
  { word: 'perfect', weight: 5 },
  { word: 'brilliant', weight: 5 },
  { word: 'fantastic', weight: 5 },
  { word: 'superb', weight: 5 },
  { word: 'exceptional', weight: 5 },
  // Moderate positive words (weight 4)
  { word: 'great', weight: 4 },
  { word: 'wonderful', weight: 4 },
  { word: 'delightful', weight: 4 },
  { word: 'impressive', weight: 4 },
  { word: 'awesome', weight: 4 },
  { word: 'incredible', weight: 4 },
  // Standard positive words (weight 3)
  { word: 'good', weight: 3 },
  { word: 'nice', weight: 3 },
  { word: 'happy', weight: 3 },
  { word: 'pleased', weight: 3 },
  { word: 'satisfied', weight: 3 },
  { word: 'love', weight: 3 },
  { word: 'enjoy', weight: 3 },
  { word: 'recommend', weight: 3 },
  // Mild positive words (weight 2)
  { word: 'like', weight: 2 },
  { word: 'fine', weight: 2 },
  { word: 'decent', weight: 2 },
  { word: 'adequate', weight: 2 },
  { word: 'positive', weight: 2 },
  // Weak positive words (weight 1)
  { word: 'acceptable', weight: 1 },
  { word: 'okay', weight: 1 },
  { word: 'ok', weight: 1 },
  { word: 'passable', weight: 1 }
];

const NEGATIVE_WORDS: SentimentWord[] = [
  // Strong negative words (weight 5)
  { word: 'terrible', weight: 5 },
  { word: 'horrible', weight: 5 },
  { word: 'awful', weight: 5 },
  { word: 'dreadful', weight: 5 },
  { word: 'abysmal', weight: 5 },
  { word: 'disastrous', weight: 5 },
  { word: 'catastrophic', weight: 5 },
  // Moderate negative words (weight 4)
  { word: 'bad', weight: 4 },
  { word: 'poor', weight: 4 },
  { word: 'disappointing', weight: 4 },
  { word: 'frustrating', weight: 4 },
  { word: 'annoying', weight: 4 },
  { word: 'hate', weight: 4 },
  // Standard negative words (weight 3)
  { word: 'dislike', weight: 3 },
  { word: 'fail', weight: 3 },
  { word: 'failure', weight: 3 },
  { word: 'problem', weight: 3 },
  { word: 'issue', weight: 3 },
  { word: 'defective', weight: 3 },
  { word: 'broken', weight: 3 },
  { word: 'upset', weight: 3 },
  // Mild negative words (weight 2)
  { word: 'mediocre', weight: 2 },
  { word: 'lacking', weight: 2 },
  { word: 'flawed', weight: 2 },
  { word: 'inferior', weight: 2 },
  { word: 'negative', weight: 2 },
  // Weak negative words (weight 1)
  { word: 'unimpressive', weight: 1 },
  { word: 'unfortunate', weight: 1 },
  { word: 'meh', weight: 1 },
  { word: 'eh', weight: 1 }
];

// Words that negate or flip sentiment
const NEGATORS = [
  'not', 'no', 'never', 'neither', 'nor', 'barely', 'hardly', 'doesn\'t', 'don\'t',
  'didn\'t', 'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t', 'couldn\'t',
  'wouldn\'t', 'shouldn\'t', 'isn\'t', 'aren\'t', 'can\'t', 'cannot'
];

// Words that intensify sentiment
const INTENSIFIERS = [
  'very', 'extremely', 'really', 'so', 'truly', 'absolutely', 'completely',
  'totally', 'utterly', 'highly', 'especially', 'extraordinarily', 'particularly',
  'remarkably', 'exceedingly', 'immensely', 'incredibly', 'super', 'most'
];

// Words that reduce sentiment
const DIMINISHERS = [
  'somewhat', 'slightly', 'a bit', 'rather', 'kind of', 'sort of', 'a little',
  'fairly', 'moderately', 'partially', 'sometimes', 'occasionally'
];

/**
 * Enhanced sentiment analysis implementation
 */
export async function processSentimentAnalysis(
  text: string, 
  deepseekResult?: string
): Promise<SentimentResult> {
  // If we have a valid deepseek result, use it with high confidence
  if (deepseekResult && ['positive', 'negative', 'neutral'].includes(deepseekResult.toLowerCase().trim())) {
    const sentiment = deepseekResult.toLowerCase().trim() as 'positive' | 'negative' | 'neutral';
    
    // Assign a score based on the sentiment
    const score = sentiment === 'positive' ? 0.85 : sentiment === 'negative' ? -0.85 : 0;
    
    return {
      sentiment,
      score,
      confidence: 0.95, // High confidence for LLM results
      modelUsed: 'deepseek'
    };
  }
  
  // Fallback to enhanced rule-based implementation
  // Preprocess and tokenize the text
  const cleanText = text.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split text into words
  const words = cleanText.split(' ');
  
  // Analyze text sentence by sentence for better context handling
  const sentences = text.replace(/([.!?])\s+/g, '$1|').split('|');
  const sentenceScores: number[] = [];
  
  sentences.forEach(sentence => {
    if (sentence.trim().length === 0) return;
    
    const sentenceWords = sentence.toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');
    
    let sentenceScore = 0;
    let totalWeight = 0;
    
    // Process each word in context of surrounding words
    for (let i = 0; i < sentenceWords.length; i++) {
      const word = sentenceWords[i];
      
      // Find matching sentiment words
      const positiveMatch = POSITIVE_WORDS.find(pw => pw.word === word);
      const negativeMatch = NEGATIVE_WORDS.find(nw => nw.word === word);
      
      if (positiveMatch || negativeMatch) {
        // Get base sentiment and weight
        let sentiment = positiveMatch ? 1 : -1;
        let weight = positiveMatch ? positiveMatch.weight : negativeMatch!.weight;
        
        // Check for negation in a window of 3 words before this sentiment word
        const context = sentenceWords.slice(Math.max(0, i-3), i);
        const hasNegation = context.some(w => NEGATORS.includes(w));
        
        // Negation flips the sentiment
        if (hasNegation) {
          sentiment *= -1;
        }
        
        // Check for intensifiers/diminishers in a window of 2 words before
        const intensifiers = context.filter(w => INTENSIFIERS.includes(w)).length;
        const diminishers = context.filter(w => DIMINISHERS.includes(w)).length;
        
        // Adjust weight based on modifiers
        const intensifierMultiplier = 1 + (intensifiers * 0.3); // +30% per intensifier
        const diminisherMultiplier = 1 - (diminishers * 0.3); // -30% per diminisher
        
        weight = weight * intensifierMultiplier * diminisherMultiplier;
        
        // Add to sentence score
        sentenceScore += sentiment * weight;
        totalWeight += weight;
      }
    }
    
    // Normalize and add sentence score
    if (totalWeight > 0) {
      sentenceScores.push(sentenceScore / totalWeight);
    }
  });
  
  // Calculate overall sentiment score
  let finalScore = 0;
  if (sentenceScores.length > 0) {
    // Simple average of sentence scores
    finalScore = sentenceScores.reduce((sum, score) => sum + score, 0) / sentenceScores.length;
  } else {
    // Fallback to word frequency if no sentences were processed
    let positiveSum = 0;
    let negativeSum = 0;
    
    words.forEach(word => {
      const positiveMatch = POSITIVE_WORDS.find(pw => pw.word === word);
      const negativeMatch = NEGATIVE_WORDS.find(nw => nw.word === word);
      
      if (positiveMatch) positiveSum += positiveMatch.weight;
      if (negativeMatch) negativeSum += negativeMatch.weight;
    });
    
    const totalSentiment = positiveSum + negativeSum;
    if (totalSentiment > 0) {
      finalScore = (positiveSum - negativeSum) / totalSentiment;
    }
  }
  
  // Constrain score to -1 to 1 range
  finalScore = Math.max(-1, Math.min(1, finalScore));
  
  // Determine sentiment category
  let sentiment: 'positive' | 'negative' | 'neutral';
  if (finalScore > 0.15) {
    sentiment = 'positive';
  } else if (finalScore < -0.15) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }
  
  // Calculate confidence based on several factors
  let confidence: number;
  
  if (sentenceScores.length === 0) {
    // If no sentiment words found, low confidence
    confidence = 0.4;
  } else {
    // Base confidence on:
    // 1. The magnitude of the score (stronger scores = higher confidence)
    const magnitudeConfidence = Math.min(0.8, Math.abs(finalScore) * 0.9);
    
    // 2. Consistency across sentences (less variance = higher confidence)
    let consistencyConfidence = 0.7;
    if (sentenceScores.length > 1) {
      // Calculate variance
      const mean = sentenceScores.reduce((sum, score) => sum + score, 0) / sentenceScores.length;
      const variance = sentenceScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / sentenceScores.length;
      
      // High variance = lower confidence, low variance = higher confidence
      consistencyConfidence = Math.max(0.5, 0.9 - variance);
    }
    
    // 3. Amount of sentiment-bearing content
    const contentAmount = Math.min(sentenceScores.length / 3, 1) * 0.8;
    
    // Combine factors
    confidence = (magnitudeConfidence * 0.6) + (consistencyConfidence * 0.3) + (contentAmount * 0.1);
  }
  
  // Ensure confidence is between 0.4 and 0.95
  confidence = 0.4 + (confidence * 0.55);
  
  return {
    sentiment,
    score: parseFloat(finalScore.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    modelUsed: 'rule-based'
  };
} 