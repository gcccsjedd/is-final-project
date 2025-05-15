interface SummarizationResult {
  text: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  modelUsed: 'deepseek' | 'extractive';
}

export async function processTextSummarization(
  text: string,
  maxLength: number = 150,
  minLength: number = 50,
  deepseekResult?: string
): Promise<SummarizationResult> {
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
  
  return advancedExtractiveSummarization(text, maxLength, minLength);
}

function advancedExtractiveSummarization(
  text: string,
  maxLength: number = 150,
  minLength: number = 50
): SummarizationResult {
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
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
  
  const documentWordFreq = getWordFrequency(text);
  
  const sentenceScores: Record<number, number> = {};
  const sentenceWords: Record<number, number> = {};
  const sentenceLengths: Record<number, number> = {};
  
  const potentialTitles = new Set<number>();
  if (sentences.length > 0) {
    potentialTitles.add(0);
  }
  
  sentences.forEach((sentence, idx) => {
    if (sentence.length < 60 && sentence.split(' ').length < 10 && 
        !/[.,:;]/.test(sentence.slice(0, -1))) {
      potentialTitles.add(idx);
    }
    if (sentence.trim().endsWith('?')) {
      potentialTitles.add(idx);
    }
  });
  
  const sortedWords = Object.entries(documentWordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  sentences.forEach((sentence, idx) => {
    const sentenceWordFreq = getWordFrequency(sentence);
    let wordCount = 0;
    let score = 0;
    
    Object.entries(sentenceWordFreq).forEach(([word, freq]) => {
      if (!stopWords.includes(word)) {
        const tf = freq / Object.keys(sentenceWordFreq).length;
        
        const sentencesWithWord = sentences.filter(s => 
          s.toLowerCase().includes(word.toLowerCase())
        ).length;
        const idf = Math.log(sentences.length / (1 + sentencesWithWord));
        
        score += tf * idf;
        
        if (sortedWords.includes(word)) {
          score += 0.5;
        }
        
        wordCount++;
      }
    });
    
    if (idx === 0 || idx === sentences.length - 1) {
      score += 0.5;
    }
    if (idx < sentences.length * 0.2 || idx > sentences.length * 0.8) {
      score += 0.2;
    }
    
    if (potentialTitles.has(idx)) {
      score += 1;
    }
    
    sentenceScores[idx] = score;
    sentenceWords[idx] = wordCount;
    sentenceLengths[idx] = sentence.length;
  });
  
  for (const idx in sentenceScores) {
    const numIdx = parseInt(idx);
    if (sentenceWords[numIdx] > 2) {
      sentenceScores[numIdx] = sentenceScores[numIdx] * (0.5 + 0.5 * (sentenceWords[numIdx] / 20));
    } else {
      sentenceScores[numIdx] = 0;
    }
  }
  
  const targetLength = Math.min(maxLength, Math.max(minLength, text.length * 0.3));
  
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
      topSentenceIndices.push(idx);
      currentLength += sentenceLengths[idx];
    } else {
      break;
    }
  }
  
  topSentenceIndices.sort((a, b) => a - b);
  
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