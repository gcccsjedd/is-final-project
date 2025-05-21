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

// Type definition for model information
interface ModelInfo {
    name: string;
    description: string;
    recommended: boolean;
}

// Type definition for API information response
interface ApiInfo {
    status: 'online' | 'offline';
    version: string;
    availableModels: ModelInfo[];
    endpoints: {
        post: {
            description: string;
            requestFormat: Record<string, any>;
            responseFormat: Record<string, any>;
        };
    };
    usage: {
        examples: string[];
        rateLimit: string;
    };
}

// GET handler that returns API information and status
export const GET: RequestHandler = async () => {
    try {
        // Check if Ollama service is available
        let ollamaStatus: 'online' | 'offline' = 'offline';
        
        try {
            const statusCheck = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            ollamaStatus = statusCheck.ok ? 'online' : 'offline';
        } catch (error) {
            console.error('Ollama service check failed:', error);
            ollamaStatus = 'offline';
        }
        
        // Define API information
        const apiInfo: ApiInfo = {
            status: ollamaStatus,
            version: '1.0.0',
            availableModels: [
                {
                   name: 'deepseek-r1:latest',
                    description: 'DeepSeek R1 model for high-quality text summarization',
                    recommended: true 
                    
                },
                {  
                    name: 'llama3',
                    description: 'Llama 3 model for general text summarization',
                    recommended: false
                },
                {
                    name: 'mistral',
                    description: 'Mistral model for efficient summarization',
                    recommended: false
                }
            ],
            endpoints: {
                post: {
                    description: 'Summarizes text and extracts the main idea',
                    requestFormat: {
                        text: 'string (required) - The text to summarize'
                    },
                    responseFormat: {
                        summary: 'string[] - Array of summary sentences',
                        mainIdea: 'string - The main idea in one sentence',
                        originalLength: 'number - Approximate sentence count of original text',
                        summaryLength: 'number - Number of sentences in the summary',
                        model: 'string - The model used for summarization'
                    }
                }
            },
            usage: {
                examples: [
                    'POST /api/summarize with JSON body: {"text": "Your text to summarize"}',
                    'Maximum text length: 10,000 characters'
                ],
                rateLimit: '60 requests per hour'
            }
        };
        
        return json(apiInfo, {
            headers: {
                'Cache-Control': 'max-age=60' // Cache for 60 seconds
            }
        });
    } catch (error) {
        console.error('Error in GET handler:', error);
        return json(
            createErrorResponse(
                'Failed to retrieve API information',
                error instanceof Error ? error.message : String(error)
            ),
            { status: 500 }
        );
    }
};

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
        const { text } = validation.data;

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

        // Make request to Ollama API with llama3 model
        const ollamaResponse = await fetch(ollamaEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-r1:latest',
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
            model: 'deepseek:r1:latest'
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