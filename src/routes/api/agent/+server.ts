// src/routes/api/agent/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { text } = await request.json();
        
        if (!text?.trim()) {
            return json({ error: 'Text is required' }, { status: 400 });
        }

        const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
        const OPENROUTER_REFERER = import.meta.env.VITE_OPENROUTER_REFERER;
        const OPENROUTER_SITE_NAME = import.meta.env.VITE_OPENROUTER_SITE_NAME;

        if (!OPENROUTER_API_KEY) {
            throw new Error("OpenRouter API key not configured");
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": OPENROUTER_REFERER || "http://localhost:5173",
                "X-Title": OPENROUTER_SITE_NAME || "Local Dev",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "mistralai/mistral-7b-instruct:free",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a concise summarizer. Respond with a 2-3 sentence summary."
                    },
                    {
                        "role": "user", 
                        "content": `Summarize this text: ${text}`
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 150
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to generate summary');
        }

        const summary = data.choices[0]?.message?.content;
        
        if (!summary) {
            throw new Error('No summary generated');
        }

        return json({ summary });
        
    } catch (error) {
        console.error('OpenRouter API error:', error);
        return json({ 
            error: error instanceof Error ? error.message : 'Failed to generate summary'
        }, { status: 500 });
    }
};