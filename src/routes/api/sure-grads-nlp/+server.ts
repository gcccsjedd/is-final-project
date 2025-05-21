import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Ollama } from 'ollama';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate JSON content type
		const contentType = request.headers.get('Content-Type');
		if (contentType !== 'application/json') {
			return json({ error: "Unsupported Content-Type. Please use 'application/json'." }, { status: 400 });
		}

		const { userMessage } = await request.json();
		if (!userMessage || typeof userMessage !== 'string') {
			return json({ error: 'Invalid or missing userMessage' }, { status: 400 });
		}

		const ollama = new Ollama();
		const prompt = `
You are a sentiment analysis expert. Analyze the following message and reply in the format:
Sentiment: <Positive|Negative|Neutral>
Explanation: <brief reason why>

Message:
"${userMessage}"
		`;

		const response = await ollama.generate({
			model: 'llama3.2:latest',
			prompt
		});

		const output = response.response?.trim() || '';
		if (!output) throw new Error('Empty response from Ollama');

		// Extract sentiment and explanation
		const sentimentMatch = output.match(/Sentiment:\s*(Positive|Negative|Neutral)/i);
		const explanationMatch = output.match(/Explanation:\s*(.*)/i);

		const sentiment = sentimentMatch?.[1] ?? 'Unknown';
		const explanation = explanationMatch?.[1] ?? 'No explanation provided.';

		return json({
			sentiment,
			explanation,
			message: userMessage
		});
	} catch (error) {
		console.error('Error in sentiment analysis:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
	}
};
