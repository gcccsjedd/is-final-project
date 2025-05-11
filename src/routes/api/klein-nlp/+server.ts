import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

async function callOllama(prompt: string) {
    const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama3.2:latest',
            prompt,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error('Failed to call Ollama API');
    }

    return response.json();
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { text, type } = await request.json();

        if (!text) {
            return json({ error: 'Text is required' }, { status: 400 });
        }

        let prompt: string;
        if (type === 'summary') {
            prompt = `Please provide a concise summary of the following text:\n\n${text}`;
        } else if (type === 'sentiment') {
            prompt = `Analyze the sentiment of the following text and provide a response in JSON format with fields: sentiment (positive/negative/neutral), confidence (0-1), and explanation:\n\n${text}`;
        } else {
            return json({ error: 'Invalid analysis type. Use "summary" or "sentiment"' }, { status: 400 });
        }

        const result = await callOllama(prompt);
        return json(result);
    } catch (error) {
        console.error('Error processing request:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 