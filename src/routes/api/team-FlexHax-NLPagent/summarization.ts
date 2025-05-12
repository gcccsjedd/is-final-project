// import type { NlpRequest } from './validate';

interface SummarizationResult {
  text: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  modelUsed: 'deepseek' | 'extractive';
}

/**
 * Process text summarization request
 */
export async function processTextSummarization(
  text: string,
  maxLength: number = 150,
  minLength: number = 50,
  deepseekResult?: string
): Promise<SummarizationResult> {
  // If we have a valid deepseek result, use it
  if (deepseekResult && deepseekResult.trim().length > 0) {
    const summary = deepseekResult.trim();
    
    return {
      text,
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: parseFloat((summary.length / text.length).toFixed(2)),
      modelUsed: 'deepseek'
    };
  }
  
  // Fallback to enhanced extractive summarization approach
  return advancedExtractiveSummarization(text, maxLength, minLength);
}

/**
 * Advanced extractive summarization that combines multiple techniques:
 * 1. TF-IDF scoring
 * 2. Sentence position importance
 * 3. Sentence length filtering
 * 4. Title/heading detection
 * 5. Keyword/entity presence
 * 6. Topic coherence
 */
function advancedExtractiveSummarization(
  text: string,
  maxLength: number = 150,
  minLength: number = 50
): SummarizationResult {
  // Preprocessing: split text into sentences
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short sentences
  
  if (sentences.length === 0) {
    return {
      text,
      summary: text,
      originalLength: text.length,
      summaryLength: text.length,
      compressionRatio: 1,
      modelUsed: 'extractive'
    };
  }
  
  // Very short text doesn't need summarization
  if (text.length < minLength * 2) {
    return {
      text,
      summary: text,
      originalLength: text.length,
      summaryLength: text.length,
      compressionRatio: 1,
      modelUsed: 'extractive'
    };
  }
  
  // Stop words to filter out for TF-IDF calculation
  const stopWords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what', 
    'which', 'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than', 'such',
    'when', 'while', 'who', 'with', 'at', 'from', 'into', 'during', 'including',
    'until', 'against', 'among', 'throughout', 'despite', 'towards', 'upon',
    'of', 'to', 'in', 'for', 'on', 'by', 'about', 'like', 'through', 'over', 'before', 'between',
    'after', 'since', 'without', 'under', 'within', 'along', 'following', 'across', 'behind',
    'beyond', 'plus', 'except', 'but', 'up', 'out', 'around', 'down', 'off', 'above', 'near',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
    'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'ought',
    'can', 'cannot', 'may', 'might', 'must', 'shall', 'will', 'not', 'isn', 'aren',
    'didn', 'doesn', 'hadn', 'hasn', 'haven', 'wasn', 'weren', 'won', 'wouldn'
  ];
  
  // Helper function: Calculate word frequency
  const getWordFrequency = (text: string) => {
    const words = text.toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');
    
    const wordFreq: Record<string, number> = {};
    
    words.forEach(word => {
      if (word.length > 1 && !stopWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    return wordFreq;
  };
  
  // Calculate word frequency across the entire document
  const documentWordFreq = getWordFrequency(text);
  
  // Score each sentence based on multiple factors
  const sentenceScores: Record<number, number> = {};
  const sentenceWords: Record<number, number> = {};
  const sentenceLengths: Record<number, number> = {};
  
  // 1. Identify potential title or heading sentences (typically at the beginning)
  const potentialTitles = new Set<number>();
  if (sentences.length > 0) {
    potentialTitles.add(0); // First sentence is often a title or introduction
  }
  
  // Check for short sentences that might be headings
  sentences.forEach((sentence, idx) => {
    // Short sentences with no punctuation except at the end
    if (sentence.length < 60 && sentence.split(' ').length < 10 && 
        !/[.,:;]/.test(sentence.slice(0, -1))) {
      potentialTitles.add(idx);
    }
    // Sentences that end with ? might be important questions
    if (sentence.trim().endsWith('?')) {
      potentialTitles.add(idx);
    }
  });
  
  // 2. Identify important keywords (top 10 by frequency)
  const sortedWords = Object.entries(documentWordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  // Calculate TF-IDF and other scores for each sentence
  sentences.forEach((sentence, idx) => {
    const sentenceWordFreq = getWordFrequency(sentence);
    let wordCount = 0;
    let score = 0;
    
    // TF-IDF score component
    Object.entries(sentenceWordFreq).forEach(([word, freq]) => {
      if (!stopWords.includes(word)) {
        // Term Frequency in this sentence
        const tf = freq / Object.keys(sentenceWordFreq).length;
        
        // Inverse Document Frequency (how rare the word is across all sentences)
        const sentencesWithWord = sentences.filter(s => 
          s.toLowerCase().includes(word.toLowerCase())
        ).length;
        const idf = Math.log(sentences.length / (1 + sentencesWithWord));
        
        // TF-IDF score
        score += tf * idf;
        
        // Boost sentences containing top keywords
        if (sortedWords.includes(word)) {
          score += 0.5;
        }
        
        wordCount++;
      }
    });
    
    // Position-based importance
    // First and last sentences often contain important information
    if (idx === 0 || idx === sentences.length - 1) {
      score += 0.5;
    }
    // Beginning and end paragraphs
    if (idx < sentences.length * 0.2 || idx > sentences.length * 0.8) {
      score += 0.2;
    }
    
    // Title/heading boost
    if (potentialTitles.has(idx)) {
      score += 1;
    }
    
    // Store scores and metadata
    sentenceScores[idx] = score;
    sentenceWords[idx] = wordCount;
    sentenceLengths[idx] = sentence.length;
  });
  
  // Normalize scores by sentence length to prevent bias toward longer sentences
  // but still maintain some preference for information-dense sentences
  for (const idx in sentenceScores) {
    const numIdx = parseInt(idx);
    if (sentenceWords[numIdx] > 2) { // Only consider sentences with at least 3 meaningful words
      sentenceScores[numIdx] = sentenceScores[numIdx] * (0.5 + 0.5 * (sentenceWords[numIdx] / 20));
    } else {
      sentenceScores[numIdx] = 0; // Effectively eliminate sentences with too few content words
    }
  }
  
  // Determine how many sentences to include
  // Start with a target percentage based on desired compression
  const targetLength = Math.min(maxLength, Math.max(minLength, text.length * 0.3));
  
  // Sort sentences by score and select top ones until we reach target length
  const topSentenceIndices: number[] = [];
  let currentLength = 0;
  
  const sortedIndices = Object.entries(sentenceScores)
    .sort((a, b) => parseFloat(b[1].toString()) - parseFloat(a[1].toString()))
    .map(entry => parseInt(entry[0]));
  
  for (const idx of sortedIndices) {
    if (currentLength + sentenceLengths[idx] <= targetLength || topSentenceIndices.length === 0) {
      topSentenceIndices.push(idx);
      currentLength += sentenceLengths[idx];
    } else if (currentLength < minLength) {
      // Ensure we meet minimum length
      topSentenceIndices.push(idx);
      currentLength += sentenceLengths[idx];
    } else {
      break;
    }
  }
  
  // Sort indices to preserve original sentence order
  topSentenceIndices.sort((a, b) => a - b);
  
  // Build summary
  const summaryText = topSentenceIndices.map(idx => sentences[idx]).join(' ');
  
  return {
    text,
    summary: summaryText,
    originalLength: text.length,
    summaryLength: summaryText.length,
    compressionRatio: parseFloat((summaryText.length / text.length).toFixed(2)),
    modelUsed: 'extractive'
  };
} 