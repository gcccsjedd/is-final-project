import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { Ollama } from "ollama";

/**
 * Sentiment Analysis API Implementation
 * API Path: /api/3rdReich-sentimentAnalysis
 * 
 * Uses DeepSeek language model via Ollama for sentiment classification
 */

/**
 * Input validation type definition for sentiment analysis requests
 */
interface SentimentAnalysisInput {
	text: string;
	detailed?: boolean;
}

/**
 * Interface for Ollama model response
 */
interface ModelResponse {
	message: {
		content: string;
	}
}

/**
 * Validates input for sentiment analysis API
 * @param input The input object to validate
 * @returns Validation result with success flag and error details or validated data
 */
function validateInput(input: any): { success: boolean; error?: string; data?: SentimentAnalysisInput } {
	// Check if input is an object
	if (!input || typeof input !== 'object') {
		return { success: false, error: "Input must be an object" };
	}

	// Check for required text field
	if (!input.text || typeof input.text !== 'string') {
		return { success: false, error: "Text field is required and must be a string" };
	}

	// Check text length
	if (input.text.length < 1 || input.text.length > 5000) {
		return { success: false, error: "Text must be between 1 and 5000 characters" };
	}

	// Check detailed flag if provided
	if (input.detailed !== undefined && typeof input.detailed !== 'boolean') {
		return { success: false, error: "Detailed flag must be a boolean when provided" };
	}

	// Return validated data with detailed defaulting to false if undefined
	return { 
		success: true, 
		data: { 
			text: input.text, 
			detailed: input.detailed === true 
		} 
	};
}

// Lazy-loaded Ollama client to avoid initialization issues at startup
let ollamaClient: Ollama | null = null;

/**
 * Gets or creates the Ollama client
 * @returns Ollama client instance
 */
function getOllamaClient() {
    if (!ollamaClient) {
        ollamaClient = new Ollama({ 
            host: 'http://localhost:11434'
        });
    }
    return ollamaClient;
}

/**
 * Finds the available DeepSeek model from Ollama
 * @returns The name of the available DeepSeek model or null if none found
 */
async function findDeepSeekModel(): Promise<string | null> {
    try {
        const ollama = getOllamaClient();
        
        // Possible model variations
        const modelOptions = [
            'deepseek-r1-7b',
            'deepseek-coder:7b-instruct-q4_0',
            'deepseek:latest'
        ];
        
        // List available models
        const models = await ollama.list();
        console.log("Available models:", models.models.map(m => m.name));
        
        // Try to find the exact model first
        for (const option of modelOptions) {
            const exactMatch = models.models.find(m => m.name === option);
            if (exactMatch) {
                console.log(`Found exact DeepSeek model match: ${exactMatch.name}`);
                return exactMatch.name;
            }
        }
        
        // If no exact match, look for any model containing 'deepseek'
        const partialMatch = models.models.find(m => 
            m.name.toLowerCase().includes('deepseek')
        );
        
        if (partialMatch) {
            console.log(`Found DeepSeek model: ${partialMatch.name}`);
            return partialMatch.name;
        }
        
        console.log("No DeepSeek model found");
        return null;
    } catch (error) {
        console.error("Error listing models:", error);
        return null;
    }
}

/**
 * Perform sentiment analysis using the DeepSeek model
 * @param text Text to analyze
 * @param detailed Whether to return detailed analysis
 * @returns Analysis result
 */
async function analyzeSentiment(text: string, detailed: boolean): Promise<ModelResponse> {
    // Get the Ollama client
    const ollama = getOllamaClient();
    
    // Find available DeepSeek model
    const modelName = await findDeepSeekModel();
    
    if (!modelName) {
        throw new Error("No DeepSeek model available. Please install a DeepSeek model with Ollama.");
    }
    
    console.log(`Using model ${modelName} for sentiment analysis`);
    
    // Build detailed or simple prompt based on user request
    const analysisPrompt = detailed 
        ? `Analyze the sentiment of the following text. Provide a detailed analysis including:
            - The overall sentiment (positive, negative, or neutral)
            - Confidence score (0-1)
            - Key emotional words/phrases that influenced your decision
            - Any detected nuances or mixed emotions
            
            Respond ONLY with a valid JSON object with these properties:
            {
                "sentiment": "positive", "negative", or "neutral",
                "score": a number between 0 and 1 indicating confidence,
                "key_phrases": [array of emotional phrases found in the text],
                "analysis": a brief explanation of the sentiment analysis
            }
            
            Text: "${text}"`
        : `Analyze the sentiment of the following text. Only respond with a JSON object with these properties:
            {
                "sentiment": "positive", "negative", or "neutral",
                "score": a number between 0 and 1 indicating confidence
            }
            
            Text: "${text}"`;
    
    // Call the Ollama API
    return await ollama.chat({
        model: modelName,
        messages: [
            {
                role: 'user',
                content: analysisPrompt
            }
        ],
        format: 'json'
    });
}

/**
 * POST endpoint for sentiment analysis
 * Accepts text input and returns sentiment analysis results
 * Uses the DeepSeek model through Ollama
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validationResult = validateInput(body);
        
        if (!validationResult.success) {
            return json({
                error: "Invalid input",
                details: validationResult.error
            }, { status: 400 });
        }
        
        const { text, detailed } = validationResult.data!;
        
        try {
            // Call the sentiment analysis function
            const response = await analyzeSentiment(text, detailed || false);
            
            // Get the model used for the analysis
            const modelName = await findDeepSeekModel() || "unknown";
            
            if (detailed) {
                try {
                    // Try to parse the JSON response
                    const parsedContent = JSON.parse(response.message.content);
                    return json({
                        result: parsedContent,
                        model: modelName,
                        text: text
                    });
                } catch (e) {
                    // If parsing fails, return an error
                    return json({
                        error: "Invalid model response",
                        message: "The model didn't return valid JSON. Please try again.",
                        raw_response: response.message.content
                    }, { status: 500 });
                }
            } else {
                // For simple responses, ensure we have proper JSON format
                try {
                    const parsedResponse = JSON.parse(response.message.content);
                    return json({
                        sentiment: parsedResponse.sentiment || 'neutral',
                        score: parsedResponse.score || 0.5,
                        model: modelName,
                        text: text
                    });
                } catch (e) {
                    // If parsing fails, return an error
                    return json({
                        error: "Invalid model response",
                        message: "The model didn't return valid JSON. Please try again.",
                        raw_response: response.message.content
                    }, { status: 500 });
                }
            }
            
        } catch (error) {
            console.error('Ollama API error:', error);
            return json({ 
                error: "Model processing error", 
                message: error instanceof Error ? error.message : "Failed to process with the language model"
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('Request processing error:', error);
        return json({ 
            error: "Bad request", 
            message: "Failed to parse request body"
        }, { status: 400 });
    }
};

/**
 * GET endpoint for checking API status and model availability
 */
export const GET: RequestHandler = async () => {
    try {
        // Check if Ollama and model are available
        let modelInfo = "No DeepSeek model found";
        let modelAvailable = false;
        
        try {
            const modelName = await findDeepSeekModel();
            
            if (modelName) {
                modelInfo = modelName;
                modelAvailable = true;
            }
        } catch (e) {
            console.error("Error checking Ollama models:", e);
        }
        
        return json({
            status: "online",
            message: "Sentiment Analysis API is running. Please use POST method with text payload.",
            ollama_available: modelAvailable,
            model: modelInfo,
            api_version: "1.0.0"
        });
    } catch (error) {
        return json({
            status: "error",
            message: "API is running but encountered an error",
            error: String(error)
        }, { status: 500 });
    }
};
