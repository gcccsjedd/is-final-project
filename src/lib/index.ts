// src/lib/index.ts
export interface NLPResult {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  keyPhrases: string[];
  complexity: number;
  wordCount: number;
  aiResponse?: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
}

export async function processTextWithAI(text: string): Promise<NLPResult> {
  // Basic NLP processing simulation
  const words = text.trim().split(/\s+/);
  
  // Sentiment analysis (very basic simulation)
  const sentimentWords = {
    positive: ['good', 'great', 'excellent', 'amazing', 'wonderful'],
    negative: ['bad', 'terrible', 'awful', 'horrible', 'worst']
  };

  const lowerText = text.toLowerCase();
  const positiveCount = sentimentWords.positive.filter(word => 
    lowerText.includes(word)
  ).length;
  const negativeCount = sentimentWords.negative.filter(word => 
    lowerText.includes(word)
  ).length;

  let sentiment: NLPResult['sentiment'] = 'Neutral';
  if (positiveCount > negativeCount) sentiment = 'Positive';
  if (negativeCount > positiveCount) sentiment = 'Negative';

  // Extract key phrases (simple approach)
  const keyPhrases = words
    .filter(word => word.length > 3)
    .slice(0, 5);

  // AI API request
  const aiResult = await fetchAIResponse(text);

  return {
    sentiment,
    keyPhrases,
    complexity: Math.round(
      (words.filter(word => word.length > 5).length / words.length) * 100
    ),
    wordCount: words.length,
    aiResponse: aiResult
  };
}

export async function fetchAIResponse(text: string): Promise<string> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": import.meta.env.VITE_SITE_URL || "https://localhost:5173",
        "X-Title": import.meta.env.VITE_SITE_NAME || "NLP Analyzer",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": [
          {
            "role": "user",
            "content": `Analyze the following text and provide insights: ${text}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI';
  } catch (error) {
    console.error('Error fetching AI response:', error);
    return 'Error processing AI response';
  }
}