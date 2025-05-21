import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Ollama API endpoint (default for local installations)
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL = 'deepseek-r1:1.5b';

/**
 * GET handler - provides API information
 */
export const GET: RequestHandler = async () => {
  return json({
    api: 'Ollama Sentiment Analysis API',
    version: '1.0.0',
    model: MODEL,
    usage: {
      endpoint: '/api/sentiment',
      methods: ['GET', 'POST'],
      postExample: {
        text: 'Your text to analyze'
      }
    }
  });
};

/**
 * POST handler - analyzes sentiment using Ollama API
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Check if text is provided
    if (!body.text) {
      return json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    const text = body.text.trim();
    
    // Create prompt for sentiment analysis
    const prompt = `
Analyze the sentiment of the following text and respond in JSON format with these fields:
- score: a number from -5 (very negative) to 5 (very positive)
- sentiment: one of "very negative", "negative", "neutral", "positive", or "very positive"
- explanation: a brief explanation of why this sentiment was detected

Text to analyze: "${text}"

JSON response:
`;

    // Call Ollama API
    const ollama_response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false
      })
    });

    if (!ollama_response.ok) {
      const error = await ollama_response.text();
      console.error('Ollama API error:', error);
      return json(
        { error: 'Failed to connect to Ollama API', details: error },
        { status: 502 }
      );
    }

    const result = await ollama_response.json();
    
    // Parse the LLM response to extract JSON
    let sentimentData;
    try {
      // Extract JSON from the response
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentimentData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if JSON parsing fails
        sentimentData = {
          score: 0,
          sentiment: "neutral",
          explanation: "Failed to parse model response into JSON"
        };
      }
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      sentimentData = {
        score: 0,
        sentiment: "neutral",
        explanation: "Failed to parse model response"
      };
    }

    // Return analysis results
    return json({
      original: text,
      analysis: sentimentData,
      model: MODEL,
      raw_response: result.response
    });
  } catch (error) {
    console.error('Error processing sentiment analysis:', error);
    return json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
};