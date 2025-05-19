import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  validateSummarizeInput, 
  createErrorResponse,
  type SummarizeOutput 
} from './summarySchema';

// Type definition for Ollama API response
interface OllamaResponse {
    response: string;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse request body
        const body = await request.json();
        
        // Validate against schema
        const validation = validateSummarizeInput(body);
        
        if (!validation.valid || validation.data === null) {
            return json(
                createErrorResponse('Invalid input', validation.errors || undefined), 
                { status: 400 }
            );
        }
        
        // Validation passed, extract the text - now TypeScript knows data is not null
        const { text } = validation.data;  // This line had the error

        // Define the Ollama API endpoint (assuming Ollama is running locally)
        const ollamaEndpoint = 'http://localhost:11434/api/generate';
        
        // Create a prompt that asks for both summary and main idea
        const prompt = `Please analyze the following text and provide:
          1. A summary about the given text with a maximum of 5 sentences.
          2. The main idea of the text in one sentence.
                
          Text to analyze:
          ${text}
                
          Format your response as:
          SUMMARY:
          [Your summary here]
                
          MAIN IDEA:
          [The main idea here]
        `;

        // Make request to Ollama API with deepseek-r1 model
        const ollamaResponse = await fetch(ollamaEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-r1',
                prompt: prompt,
                stream: false
            })
        });

        if (!ollamaResponse.ok) {
            const errorData = await ollamaResponse.text();
            console.error('Ollama API error:', errorData);
            return json(
                createErrorResponse('Failed to generate summary with Ollama', errorData),
                { status: 500 }
            );
        }

        const ollamaData: OllamaResponse = await ollamaResponse.json();
        
        // Extract summary and main idea from the response
        const responseText: string = ollamaData.response;
        
        // Parse the response to extract summary and main idea
        const summaryMatch = responseText.match(/SUMMARY:\s*([\s\S]*?)(?=MAIN IDEA:|$)/i);
        const mainIdeaMatch = responseText.match(/MAIN IDEA:\s*([\s\S]*?)(?=$)/i);
        
        const summary: string[] = summaryMatch ? 
            summaryMatch[1].trim().split('\n').filter(line => line.trim() !== '') : 
            ['Failed to extract summary'];
            
        const mainIdea: string = mainIdeaMatch ? 
            mainIdeaMatch[1].trim() : 
            'Failed to extract main idea';

        // Create the response object with type safety
        const response: SummarizeOutput = {
            summary,
            mainIdea,
            originalLength: text.split(/[.!?]+\s+/).length,
            summaryLength: summary.length,
            model: 'deepseek-r1'
        };

        return json(response);
    } catch (error) {
        console.error('Error in summarize endpoint:', error);
        return json(
            createErrorResponse(
                'Failed to process request',
                error instanceof Error ? error.message : String(error)
            ), 
            { status: 500 }
        );
    }
};