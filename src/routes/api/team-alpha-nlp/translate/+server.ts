// src/routes/api/team-alpha-nlp/translate/+server.ts
import { json } from '@sveltejs/kit';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export async function POST({ request }) {
  // TypeScript type annotations for 'request' and 'text' can be added here
  const { text }: { text: string } = await request.json();
  
  if (!text) {
    return json({ error: 'Text is required' }, { status: 400 });
  }
  const result = sentiment.analyze(text);

  return json({
    sentiment: result.score > 0 ? 'positive' :
               result.score < 0 ? 'negative' : 'neutral',
    score: result.score
  });
}
