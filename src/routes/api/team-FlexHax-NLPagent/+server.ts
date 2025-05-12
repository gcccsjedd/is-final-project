import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { validateNlpRequest } from './validate';
import { processSentimentAnalysis } from './sentiment';
import { processTextSummarization } from './summarization';
import { processTextClassification } from './classification';
import { processLanguageDetection } from './language-detection';
import { processKeywordExtraction } from './keyword-extraction';

/**
 * Make a request to the local Ollama API to leverage LLM models
 * for more advanced NLP tasks when needed
 */
async function callDeepseekModel(prompt: string, modelName: string = 'deepseek-coder-1.5b-instruct'): Promise<string> {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelName,
                prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error(`Error calling ${modelName} model:`, error);
        // Fallback to built-in implementation
        return '';
    }
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const requestData = await request.json();
        
        // Validate the request
        const { isValid, error } = validateNlpRequest(requestData);
        if (!isValid) {
            return json({ error }, { status: 400 });
        }
        
        const { text, task } = requestData;
        let result;
        let deepseekResult = '';
        
        // Variables for generating prompts
        let prompt = '';
        const maxLen = requestData.options?.maxLength || 200;
        const categories = requestData.options?.categories 
            ? requestData.options.categories.join(', ') 
            : 'technology, business, health, entertainment, sports, politics, science, education';
        const keywordCount = requestData.options?.keywordCount || 5;
        
        // For summarization task
        const maxLength = requestData.options?.maxLength || 150;
        const minLength = requestData.options?.minLength || 50;
        
        // Generate task-specific prompts
        switch (task) {
            case 'sentiment':
                prompt = `Analyze the sentiment of this text and respond with only "positive", "negative", or "neutral": "${text}"`;
                break;
                
            case 'summarize':
                prompt = `Summarize this text in ${maxLen} characters or less: "${text}"`;
                break;
                
            case 'classify':
                prompt = `Classify this text into exactly one of these categories: ${categories}. Reply with just the category name: "${text}"`;
                break;
                
            case 'detect-language':
                prompt = `What language is this text written in? Respond with just the language name: "${text}"`;
                break;
                
            case 'extract-keywords':
                prompt = `Extract ${keywordCount} important keywords from this text. Respond with the keywords separated by commas: "${text}"`;
                break;
        }
        
        if (prompt) {
            deepseekResult = await callDeepseekModel(prompt);
        }
        
        // Process based on the requested NLP task
        switch (task) {
            case 'sentiment':
                result = await processSentimentAnalysis(text, deepseekResult);
                break;
                
            case 'summarize':
                result = await processTextSummarization(text, maxLength, minLength, deepseekResult);
                break;
                
            case 'classify':
                result = await processTextClassification(text, requestData.options, deepseekResult);
                break;
                
            case 'detect-language':
                result = await processLanguageDetection(text, deepseekResult);
                break;
                
            case 'extract-keywords':
                result = await processKeywordExtraction(text, requestData.options, deepseekResult);
                break;
                
            default:
                return json({ error: 'Unsupported NLP task' }, { status: 400 });
        }
        
        return json({ result });
    } catch (error) {
        console.error('NLP API error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 