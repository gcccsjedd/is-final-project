import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENROUTER_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { content } = await request.json();

		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENROUTER_API_KEY}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://your-site.com',
				'X-Title': 'Your Site Name' 
			},
			body: JSON.stringify({
				model: 'mistralai/mistral-7b-instruct:free',
				messages: [
					{
						role: 'user',
						content: content
					}
				]
			})
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status}`);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Summarize API Error:', error);
		return json({ error: 'Something went wrong.' }, { status: 500 });
	}
};
