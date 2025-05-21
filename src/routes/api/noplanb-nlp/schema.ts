import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { 
  SentimentAnalysisRequest, 
  SentimentAnalysisResponse, 
  ApiInfoResponse,
  ErrorResponse,
  OllamaApiRequest,
  OllamaApiResponse
} from './schema';

// Ollama API endpoint (default for local installations)
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL = 'deepseek-r1:1.5b';

/**
 * GET handler - provides API information
 */
export const GET: RequestHandler = async () => {
  const response: ApiInfoResponse = {
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
  };
  
  return json(response);
};

/**
 * POST handler - analyzes sentiment using Ollama API
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json() as SentimentAnalysisRequest;
    
    // Check if text is provided
    if (!body.text) {
      const errorResponse: ErrorResponse = { 
        error: 'Missing required field: text' 
      };
      
      return json(errorResponse, { status: 400 });
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
    const ollamaRequest: OllamaApiRequest = {
      model: MODEL,
      prompt: prompt,
      stream: false
    };
    
    const ollama_response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ollamaRequest)
    });

    if (!ollama_response.ok) {
      const error = await ollama_response.text();
      console.error('Ollama API error:', error);
      
      const errorResponse: ErrorResponse = {
        error: 'Failed to connect to Ollama API', 
        details: error
      };
      
      return json(errorResponse, { status: 502 });
    }

    const result = await ollama_response.json() as OllamaApiResponse;
    
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
    const response: SentimentAnalysisResponse = {
      original: text,
      analysis: sentimentData,
      model: MODEL,
      raw_response: result.response
    };
    
    return json(response);
  } catch (error) {
    console.error('Error processing sentiment analysis:', error);
    
    const errorResponse: ErrorResponse = {
      error: 'Failed to process request', 
      details: String(error)
    };
    
    return json(errorResponse, { status: 500 });
  }
};