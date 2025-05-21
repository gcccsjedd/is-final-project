import type { NlpRequest } from './validate';

interface KeywordExtractionResult {
  text: string;
  keywords: {
    keyword: string;
    score: number;
  }[];
  modelUsed: 'deepseek' | 'tfidf';
}

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

const PHRASE_EXCEPTIONS = [
  'artificial intelligence', 'machine learning', 'deep learning', 'natural language',
  'computer vision', 'big data', 'neural network', 'internet of things',
  'virtual reality', 'augmented reality', 'cloud computing'
];

export async function processKeywordExtraction(
  text: string, 
  options?: NlpRequest['options'],
  deepseekResult?: string
): Promise<KeywordExtractionResult> {
  const keywordCount = options?.keywordCount || 5;
  
  if (deepseekResult && deepseekResult.trim().length > 0) {
    try {
      const result = deepseekResult.trim();
      
      const keywordList = result
        .split(/,|\n/)
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, keywordCount);
      
      if (keywordList.length > 0) {
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
    }
  }
  
  return enhancedKeywordExtraction(text, keywordCount);
}

function enhancedKeywordExtraction(text: string, keywordCount: number): KeywordExtractionResult {
  let processedText = text;
  const preservedPhrases: Record<string, string> = {};
  
  PHRASE_EXCEPTIONS.forEach((phrase, idx) => {
    const placeholder = `__PHRASE_${idx}__`;
    const regex = new RegExp(phrase, 'gi');
    if (regex.test(processedText)) {
      preservedPhrases[placeholder] = phrase;
      processedText = processedText.replace(regex, placeholder);
    }
  });
  
  const cleanText = processedText.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .filter(s => s.trim().length > 0);
  
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
      return (!STOPWORDS.includes(first) || !STOPWORDS.includes(second));
    });
  
  const trigrams = extractNGrams(cleanText, 3)
    .filter(trigram => {
      const words = trigram.split(' ');
      return words.some(w => !STOPWORDS.includes(w));
    });
  
  const specialPhrases = Object.keys(preservedPhrases).map(key => preservedPhrases[key]);
  
  const potentialKeywords = [...unigrams, ...bigrams, ...trigrams, ...specialPhrases];
  
  const termFreq: Record<string, number> = {};
  potentialKeywords.forEach(term => {
    termFreq[term] = (termFreq[term] || 0) + 1;
  });
  
  const docFreq: Record<string, number> = {};
  const totalDocs = sentences.length;
  
  potentialKeywords.forEach(term => {
    if (!docFreq[term]) {
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
  
  const tfIdfScores: {keyword: string; score: number}[] = Object.keys(termFreq).map(term => {
    const tf = termFreq[term] / potentialKeywords.length;
    const idf = Math.log((totalDocs + 1) / (docFreq[term] + 1)) + 1;
    let score = tf * idf;
    
    const wordCount = term.split(' ').length;
    const lengthMultiplier = wordCount > 1 ? 1.0 + (wordCount - 1) * 0.2 : 1.0;
    
    let positionBonus = 1.0;
    const firstSentence = sentences[0]?.toLowerCase() || '';
    if (firstSentence.includes(term)) {
      positionBonus = 1.3;
    }
    
    const phraseBonus = specialPhrases.includes(term) ? 1.5 : 1.0;
    
    score = score * lengthMultiplier * positionBonus * phraseBonus;
    
    return {
      keyword: term,
      score
    };
  });
  
  tfIdfScores.sort((a, b) => b.score - a.score);
  
  const filteredKeywords: {keyword: string; score: number}[] = [];
  
  for (const item of tfIdfScores) {
    if (filteredKeywords.length >= keywordCount) break;
    
    const isSubstring = filteredKeywords.some(selected => 
      selected.keyword.includes(item.keyword) || item.keyword.includes(selected.keyword)
    );
    
    if (!isSubstring) {
      filteredKeywords.push(item);
    }
  }
  
  const remainingKeywords = keywordCount - filteredKeywords.length;
  if (remainingKeywords > 0) {
    const additionalKeywords = tfIdfScores
      .filter(item => !filteredKeywords.some(k => k.keyword === item.keyword))
      .slice(0, remainingKeywords);
    
    filteredKeywords.push(...additionalKeywords);
  }
  
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