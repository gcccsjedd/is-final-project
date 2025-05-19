import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const SentimentAnalysisSchema = z.object({
  text: z.string().min(1, { message: "Text cannot be empty" }).max(5000, { message: "Text must be less than 5000 characters" })
});

const positiveWords = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'happy', 
  'joy', 'love', 'awesome', 'positive', 'beautiful', 'best', 'brilliant',
  'delighted', 'excited', 'glad', 'perfect', 'terrific', 'outstanding'
]);
const negativeWords = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'sad', 'angry', 'hate',
  'negative', 'worst', 'disappointing', 'frustrated', 'disappointed',
  'annoyed', 'unhappy', 'dreadful', 'unpleasant', 'failure', 'pathetic'
]);

function analyzeSentiment(text: string) {
  // Normalize and split text
  const words = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  // Use reduce for counting
  let positiveCount = 0, negativeCount = 0;
  for (const word of words) {
    if (positiveWords.has(word)) positiveCount++;
    else if (negativeWords.has(word)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  const score = total > 0 ? (positiveCount - negativeCount) / total : 0;

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (score > 0.1) sentiment = 'positive';
  else if (score < -0.1) sentiment = 'negative';

  return {
    score,
    sentiment,
    details: {
      positiveWordCount: positiveCount,
      negativeWordCount: negativeCount,
      wordCount: words.length
    }
  };
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const result = SentimentAnalysisSchema.safeParse(data);
    if (!result.success) {
      return json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { text } = result.data;
    const analysis = analyzeSentiment(text);

    return json({ success: true, analysis });
  } catch (error) {
    console.error('Error processing sentiment analysis:', error);
    return json(
      {
        error: 'Failed to analyze sentiment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};