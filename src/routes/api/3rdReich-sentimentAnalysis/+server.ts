import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { Ollama } from "ollama";

/**
 * THIS API ANALYZES TEXT TO DETERMINE IF IT HAS POSITIVE, NEGATIVE, OR NEUTRAL SENTIMENT
 * 
 * HOW IT WORKS:
 * 1. You send text to this API
 * 2. The API sends your text to an AI model called DeepSeek
 * 3. The AI model analyzes the text and returns whether it's positive, negative, or neutral
 * 4. The API sends the results back to you
 */

/**
 * This defines what data must be sent to the API
 * - text: The text you want to analyze (required)
 * - detailed: Whether you want simple or detailed results (optional)
 */
interface SentimentAnalysisInput {
	text: string;
	detailed?: boolean;
}

/**
 * This defines what the AI model's response looks like
 */
interface ModelResponse {
	message: {
		content: string;
	}
}

/**
 * This function checks if the data sent to the API is valid
 * It makes sure:
 * - Text is provided and is a string
 * - Text isn't too long or too short
 * - The "detailed" option is true or false if provided
 */
function validateInput(input: any): { success: boolean; error?: string; data?: SentimentAnalysisInput } {
	// Check if input is an object (like {text: "some text"})
	if (!input || typeof input !== 'object') {
		return { success: false, error: "Input must be an object" };
	}

	// Make sure text was provided and is a string
	if (!input.text || typeof input.text !== 'string') {
		return { success: false, error: "Text field is required and must be a string" };
	}

	// Check text isn't too short or too long - Force string conversion to ensure length check works consistently
	const textToCheck = String(input.text);
	if (textToCheck.length < 1 || textToCheck.length > 5000) {
		return { success: false, error: "Text must be between 1 and 5000 characters" };
	}

	// Make sure detailed is a true/false value if provided
	if (input.detailed !== undefined && typeof input.detailed !== 'boolean') {
		return { success: false, error: "Detailed flag must be a boolean when provided" };
	}

	// If everything is valid, return the data
	return { 
		success: true, 
		data: { 
			text: input.text, 
			detailed: input.detailed === true 
		} 
	};
}

// This creates a connection to the AI system (Ollama) when needed
let ollamaClient: Ollama | null = null;

/**
 * Sets up a connection to the AI system running on your computer
 */
function getOllamaClient() {
    if (!ollamaClient) {
        ollamaClient = new Ollama({ 
            host: 'http://localhost:11434'  // This is where the AI system is running on your computer
        });
    }
    return ollamaClient;
}

/**
 * This function looks for the DeepSeek AI model on your computer
 * It needs to be installed separately using Ollama
 */
async function findDeepSeekModel(): Promise<string | null> {
    try {
        const ollama = getOllamaClient();
        
        // Ask Ollama what AI models are available
        const models = await ollama.list();
        console.log("Available models:", models.models.map(m => m.name));
    
        // Look for any model with "deepseek" in its name
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
 * This is the main function that does the sentiment analysis
 * It sends text to the AI model and gets back results
 */
async function analyzeSentiment(text: string, detailed: boolean): Promise<ModelResponse> {
    // Connect to the AI system
    const ollama = getOllamaClient();
    
    // Find the right AI model to use
    const modelName = await findDeepSeekModel();
    
    // Stop if no suitable AI model was found
    if (!modelName) {
        throw new Error("No DeepSeek model available. Please install a DeepSeek model with Ollama.");
    }
    
    console.log(`Using model ${modelName} for sentiment analysis`);
    
    // Create different instructions based on whether detailed analysis was requested
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
    
    // Send the text to the AI model and return its response
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
 * THIS HANDLES POST REQUESTS TO THE API
 * 
 * When someone sends data to this API using POST, this function:
 * 1. Checks if the request data is valid
 * 2. Sends the text to the AI for analysis
 * 3. Returns the analysis results
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        // Get the data sent in the request
        const body = await request.json();
        
        // Always create a fresh validation for each request
        const validationResult = validateInput({...body});
        
        // If data is invalid, return an error
        if (!validationResult.success) {
            return json({
                error: "Invalid input",
                details: validationResult.error
            }, { status: 400 });  // 400 means "Bad Request"
        }
        
        const { text, detailed } = validationResult.data!;
        
        try {
            // Send text to the AI for analysis
            const response = await analyzeSentiment(text, detailed || false);
            
            // Get the name of the AI model used
            const modelName = await findDeepSeekModel() || "unknown";
            
            if (detailed) {
                try {
                    // Try to understand the AI's response as JSON
                    const parsedContent = JSON.parse(response.message.content);
                    return json({
                        result: parsedContent,
                        model: modelName,
                        text: text
                    });
                } catch (e) {
                    // If the AI response isn't valid JSON, return an error
                    return json({
                        error: "Invalid model response",
                        message: "The model didn't return valid JSON. Please try again.",
                        raw_response: response.message.content
                    }, { status: 500 });  // 500 means "Server Error"
                }
            } else {
                // For simple responses, make sure we have valid JSON
                try {
                    const parsedResponse = JSON.parse(response.message.content);
                    return json({
                        sentiment: parsedResponse.sentiment || 'neutral',
                        score: parsedResponse.score || 0.5,
                        model: modelName,
                        text: text
                    });
                } catch (e) {
                    // If the AI response isn't valid JSON, return an error
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
 * THIS HANDLES GET REQUESTS TO THE API
 * 
 * When someone accesses this API with GET, this function:
 * 1. Checks if the AI system is working
 * 2. Returns information about the API status
 * 
 * This is useful to check if the API is online before trying to use it
 */
export const GET: RequestHandler = async () => {
    try {
        // Check if the AI model is available
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
        
        // Return information about the API's status
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
