import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { Ollama } from 'ollama';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text } = await request.json();

		if (!text?.trim()) {
			return json({ error: 'Missing text' }, { status: 400 });
		}

		const prompt = `
You are a summarization assistant. When asked to summarize, you should internally reason through the content to determine key ideas. 
Then output ONLY the summary as a JSON object in the format: { "result": "<summary>" }.
Do not include any thoughts, steps, or explanations — just the JSON result.

Summarize this:
"""${text}"""
		`.trim();

		const ollama = new Ollama({ host: 'http://localhost:11434' });

		const res = await ollama.chat({
			model: 'deepseek-r1:7b',
			messages: [{ role: 'user', content: prompt }]
		});

		const rawReply = res?.message?.content || '{}';
		const match = rawReply.match(/\{[\s\S]*\}/);
		const response = match ? JSON.parse(match[0]) : { result: 'No valid JSON found in response' };

		return json(response);
	} catch (error) {
		console.error('Summarization Error:', error);
		return json({ error: 'Failed to process summarization request' }, { status: 500 });
	}
};
