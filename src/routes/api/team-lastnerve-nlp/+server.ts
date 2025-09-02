import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// OpenRouter API constants
const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const POST: RequestHandler = async ({ request }) => {
    // Debugging: Log headers for inspection
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        headersObj[key] = value;
    });
    console.log('Request headers:', headersObj);

    try {
        // Get the request body (SvelteKit already parses it for us)
        const requestData = await request.json();
        console.log('Parsed request data:', requestData);
        
        if (!requestData) {
            console.error('Empty request body received');
            return json({
                success: false,
                error: 'Request body cannot be empty'
            }, { status: 400 });
        }

        // Validate the message field
        if (!requestData.message || typeof requestData.message !== 'string') {
            console.error('Invalid message field:', requestData);
            return json({
                success: false,
                error: 'Message must be a non-empty string'
            }, { status: 400 });
        }

        console.log('Processing message:', requestData.message.substring(0, 50) + '...');
        
        // Make the API request to OpenRouter
        const openRouterResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://nlp-processor.app',
                'X-Title': 'NLP Processor App'
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free",
                messages: [{ role: "user", content: requestData.message }],
                temperature: 0.7
            })
        });

        // Check if the response is successful
        if (!openRouterResponse.ok) {
            let errorData;
            try {
                errorData = await openRouterResponse.json();
            } catch (e) {
                errorData = { error: 'Failed to parse error response' };
            }
            
            console.error('OpenRouter API error:', {
                status: openRouterResponse.status,
                statusText: openRouterResponse.statusText,
                error: errorData
            });
            
            return json({
                success: false,
                error: errorData.error?.message || 
                      errorData.message || 
                      `API request failed with status ${openRouterResponse.status}`,
                details: openRouterResponse.statusText
            }, { status: 502 });
        }

        const result = await openRouterResponse.json();
        
        // Verify the expected data structure exists
        if (!result.choices?.[0]?.message?.content) {
            console.error('Unexpected response format:', result);
            return json({
                success: false,
                error: 'Unexpected response format from AI service',
                receivedData: result
            }, { status: 502 });
        }

        return json({
            success: true,
            response: result.choices[0].message.content
        });

    } catch (error) {
        console.error('Unexpected error in API handler:', error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unexpected server error',
            stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
};
