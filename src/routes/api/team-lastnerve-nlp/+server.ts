import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { Ollama } from "ollama";

/**
 * CONTENT EXAMINATION SERVICE API
 * Utilizes Ollama with language models for textual analysis
 * Imports necessary dependencies and interfaces
 * SvelteKit built in utilities for handling HTTP requests and responses
**/

/**
 * INTERFACE DEFINITIONS
 * Defines the structure of the request and response data
 * Used for type checking and documentation
 * ArticleExaminationRequest: Represents the request data structure |  Defines the structure for content analysis requests
 * LLMResponse: Represents the response data structure | Defines the structure for LLM responses
 * ModelDetails: Represents the details of available models | Defines the structure for model information
 * ModelsListResponse: Represents the list of available models | Defines the structure for model lists
**/

interface ArticleExaminationRequest {
    content: string;
    comprehensive?: boolean;
}

interface LLMResponse {
    message: {
        content: string;
    }
}

interface ModelDetails {
    name: string;
    modified_at?: string;
    size?: number;
    version?: string;
}

interface ModelsListResponse {
    models: Array<ModelDetails>;
}

/**
 * VALIDATION FUNCTIONS
 * Validates the request data and ensures it meets the required format
 * Returns a boolean indicating validity and a message if invalid
 * Checks if the request data is a valid object
 * Verifies the content field exists and is a string
 * Enforces content length constraints (50-12000 characters)
 * Validates the comprehensive option if present
 * Returns a validation result with processed data
**/

function validateArticleRequest(requestData: any): { 
    valid: boolean; 
    message?: string; 
    processedData?: ArticleExaminationRequest 
} {
    // Ensure data exists and is an object
    if (!requestData || typeof requestData !== 'object') {
        return { valid: false, message: "Request must contain a valid JSON object" };
    }

    // Verify content field exists and is valid
    if (!requestData.content || typeof requestData.content !== 'string') {
        return { valid: false, message: "Content field must be provided as a string" };
    }

    // Enforce content length constraints
    const contentLength = requestData.content.length;
    if (contentLength < 50) {
        return { valid: false, message: "Content too short for meaningful analysis (minimum 50 characters)" };
    }
    if (contentLength > 12000) {
        return { valid: false, message: "Content exceeds maximum length (12000 characters)" };
    }

    // Validate comprehensive option if present
    if (requestData.comprehensive !== undefined && typeof requestData.comprehensive !== 'boolean') {
        return { valid: false, message: "The comprehensive option must be a boolean value" };
    }

    // Return validated and processed data
    return { 
        valid: true, 
        processedData: { 
            content: requestData.content, 
            comprehensive: Boolean(requestData.comprehensive) 
        } 
    };
}

/**
     * LLM CLIENT INITIALIZATION
 * Initializes the LLM client and ensures it's a singleton
 * Handles the initialization of the LLM client
 * Returns the LLM client instance
 
     *LLM CLIENT MANAGEMENT
 *Implements a singleton pattern for the Ollama client
 *Connects to a local Ollama instance running on port 11434
 *Handles initialization errors gracefully
**/

// Singleton LLM client
let llmClientInstance: any = null;

async function initializeLLMClient() {
    if (!llmClientInstance) {
        try {
            const { Ollama } = await import('ollama');
            llmClientInstance = new Ollama({ 
                host: 'http://localhost:11434'
            });
            console.log("LLM client initialized successfully");
        } catch (error) {
            console.error("Failed to initialize LLM client:", error);
            throw new Error("LLM client initialization failed - check if Ollama service is running");
        }
    }
    return llmClientInstance;
}

/**
     * MODEL DISCOVERY
 * Discovers the available language model
 * Returns the name of the available model
 * Handles model discovery errors gracefully
 
     * FUNCTIONALITY
 *Primary target: 'deepseek-r1-1.5b'
 *Fallback models: 'deepseek-r1-1.5b-instruct', 'deepseek-r1-1.5b-base', etc.
 *Keyword-based fallback for any model containing 'deepseek', 'mistral', 'llama', or 'neural'
**/

async function discoverAvailableModel(): Promise<string | null> {
    try {
        const llmClient = await initializeLLMClient();
        
        // Directly use deepseek-r1-1.5b which is confirmed to be installed
        const targetModel = 'deepseek-r1-1.5b';
        
        // Retrieve available models from Ollama
        const availableModels: ModelsListResponse = await llmClient.list();
        console.log("Available LLM models:", availableModels.models.map(m => m.name).join(', '));
        
        // Check if our target model is available
        const modelMatch = availableModels.models.find(m => m.name === targetModel);
        if (modelMatch) {
            console.log(`Using specified model: ${modelMatch.name}`);
            return modelMatch.name;
        }
        
        // Fallback to other models only if the target isn't available
        const fallbackModels = [
            'deepseek-r1-1.5b-instruct',
            'deepseek-r1-1.5b-base',
            'deepseek:latest',
            'mistral:latest',
            'llama3:latest'
        ];
        
        // Try each fallback model in sequence
        for (const candidateModel of fallbackModels) {
            const fallbackMatch = availableModels.models.find(m => m.name === candidateModel);
            if (fallbackMatch) {
                console.log(`Selected fallback model: ${fallbackMatch.name}`);
                return fallbackMatch.name;
            }
        }
        
        // Last resort fallback to any model with relevant capabilities
        const fallbackKeywords = ['deepseek', 'mistral', 'llama', 'neural'];
        for (const keyword of fallbackKeywords) {
            const keywordMatch = availableModels.models.find(m => 
                m.name.toLowerCase().includes(keyword)
            );
            
            if (keywordMatch) {
                console.log(`Using keyword-matched model: ${keywordMatch.name}`);
                return keywordMatch.name;
            }
        }
        
        console.warn("No suitable language model found");
        return null;
    } catch (error) {
        console.error("Error discovering models:", error);
        return null;
    }
}

/**
 * CONTENT ANALYSIS
 * Takes content and a comprehensive flag as input
 * Uses different prompt templates based on the analysis depth
 * For comprehensive analysis, it examines:
 * - Primary subject matter and key themes
 * Returns the analysis result as a JSON object
 * Handles analysis errors gracefully
**/
async function performContentAnalysis(content: string, comprehensive: boolean): Promise<LLMResponse> {
    const llmClient = await initializeLLMClient();
    
    const modelName = await discoverAvailableModel();
    
    if (!modelName) {
        throw new Error("No suitable language model available. Please install compatible models via Ollama.");
    }
    
    console.log(`Analyzing content using ${modelName}`);
    
    // Create appropriate prompt based on analysis depth
    const promptTemplate = comprehensive 
        ? `You are a media analysis expert examining a news article. 
           Analyze the following content thoroughly and provide insights on:
           - Primary subject matter and key themes
           - Writing style and perspective (neutral, subjective, etc.)
           - Critical facts, assertions, and evidence presented
           - Language indicating potential viewpoint bias
           - Overall credibility and factual reliability assessment
           
           Format your response EXCLUSIVELY as a valid JSON object with these fields:
           {
               "primary_subject": "core topic of the content",
               "perspective": "objective", "subjective", or appropriate descriptor,
               "key_assertions": [list of main claims and facts from the article],
               "bias_indicators": [specific phrases suggesting viewpoint bias, if present],
               "reliability_index": number from 0.0 to 1.0 representing factual reliability,
               "executive_summary": "concise multi-sentence summary capturing key information"
           }
           
           Article for analysis: "${content}"`
        : `As a media analyst, examine this news article and provide a focused assessment.
           Return your analysis ONLY as a JSON object with these fields:
           {
               "primary_subject": "core topic of the content",
               "perspective": "objective", "subjective", or appropriate descriptor,
               "reliability_index": number from 0.0 to 1.0 representing factual reliability,
               "executive_summary": "single sentence capturing essential information"
           }
           
           Article for analysis: "${content}"`;
    
    // Specific configuration for deepseek-r1-1.5b model
    const options = {
        model: modelName,
        messages: [
            {
                role: 'user',
                content: promptTemplate
            }
        ],
        format: 'json'
    };
    
    // Add specific parameters for deepseek-r1-1.5b if using that model
    if (modelName === 'deepseek-r1-1.5b') {
        Object.assign(options, {
            temperature: 0.3,  // Lower temperature for more factual responses
            top_p: 0.9,        // Slightly constrained sampling
            num_predict: 1024  // Reduced token limit for 1.5B model
        });
    }
    
    // Execute analysis with the LLM
    return await llmClient.chat(options);
}

/**
 * POST endpoint for article content analysis
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        // Extract and validate request data
        const requestData = await request.json();
        const validation = validateArticleRequest(requestData);
        
        if (!validation.valid) {
            return json({
                status: "error",
                code: "VALIDATION_FAILED",
                details: validation.message
            }, { status: 400 });
        }
        
        const { content, comprehensive } = validation.processedData!;
        
        try {
            // Execute content analysis
            const analysisResponse = await performContentAnalysis(content, comprehensive || false);
            
            // Get the model used for reference
            const modelIdentifier = await discoverAvailableModel() || "unidentified";
            
            try {
                // Process the LLM response
                const structuredAnalysis = JSON.parse(analysisResponse.message.content);
                return json({
                    status: "success",
                    analysis: structuredAnalysis,
                    metadata: {
                        model: modelIdentifier,
                        content_length: content.length,
                        timestamp: new Date().toISOString(),
                        analysis_type: comprehensive ? "comprehensive" : "standard"
                    }
                });
            } catch (jsonError) {
                // Handle malformed LLM response
                return json({
                    status: "error",
                    code: "MALFORMED_RESPONSE",
                    message: "The language model returned an invalid response format",
                    raw_content: analysisResponse.message.content.substring(0, 200) + "..."
                }, { status: 500 });
            }
            
        } catch (processingError) {
            console.error('Analysis processing error:', processingError);
            return json({ 
                status: "error",
                code: "PROCESSING_FAILED", 
                message: processingError instanceof Error ? processingError.message : "Content analysis process failed"
            }, { status: 500 });
        }
        
    } catch (requestError) {
        console.error('Request handling error:', requestError);
        return json({ 
            status: "error",
            code: "INVALID_REQUEST", 
            message: "Failed to process the request body"
        }, { status: 400 });
    }
};

/**
 * GET endpoint for service status information
 */
export const GET: RequestHandler = async () => {
    try {
        // Verify system readiness and model availability
        let modelStatus = "No compatible model detected";
        let serviceReady = false;
        let preferredModelAvailable = false;
        
        try {
            const modelName = await discoverAvailableModel();
            
            if (modelName) {
                modelStatus = modelName;
                serviceReady = true;
                preferredModelAvailable = modelName === 'deepseek-r1-1.5b';
            }
        } catch (statusError) {
            console.error("Error checking system status:", statusError);
        }
        
        return json({
            service: "Content Analysis API",
            status: serviceReady ? "operational" : "degraded",
            message: serviceReady 
                ? (preferredModelAvailable 
                    ? "Content Analysis API is operational using the preferred deepseek-r1-1.5b model." 
                    : "Content Analysis API is available but using a fallback model.")
                : "Service is running but no language models are available.",
            system_ready: serviceReady,
            active_model: modelStatus,
            preferred_model: "deepseek-r1-1.5b",
            using_preferred: preferredModelAvailable,
            version: "2.1.0",
            supported_features: ["news_analysis", "bias_detection", "credibility_assessment"]
        });
    } catch (error) {
        return json({
            service: "Content Analysis API",
            status: "error",
            message: "Service is running but encountered an internal error",
            details: String(error)
        }, { status: 500 });
    }
};

