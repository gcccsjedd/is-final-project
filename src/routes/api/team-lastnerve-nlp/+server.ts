import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// OpenRouter API constants
const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { message } = await request.json();
        
        if (!message || typeof message !== 'string') {
            return json({
                success: false,
                error: 'Invalid message format'
            }, { status: 400 });
        }

        console.log('Sending request to OpenRouter API');
        
        // Make the API request to OpenRouter
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://nlp-processor.app', // Replace with your actual site URL
                'X-Title': 'NLP Processor App'
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free", // Updated model name format
                messages: [{ role: "user", content: message }],
                temperature: 0.7
            })
        });

        // Check if the response is successful
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            
            return json({
                success: false,
                error: errorData.error?.message || errorData.message || `API returned status code ${response.status}: ${response.statusText}`
            }, { status: 500 });
        }

        const data = await response.json();
        
        // Verify the expected data structure exists
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unexpected response format:', data);
            return json({
                success: false,
                error: 'Unexpected response format from API'
            }, { status: 500 });
        }

        return json({
            success: true,
            response: data.choices[0].message.content
        });
    } catch (error) {
        console.error('Error processing NLP request:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process NLP request'
        }, { status: 500 });
    }
};