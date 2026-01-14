import { json } from '@sveltejs/kit';
import ollama from 'ollama';

export async function POST({ request }) {
	const { text } = await request.json();

	if (!text) {
		return json({ error: 'Text is required' }, { status: 400 });
	}

	const prompt = `
You are a sentiment analysis tool.

ONLY respond with a **raw JSON object** and nothing else. Your JSON must follow this exact format:

{
  "sentiment": "positive", 
  "score": 2
}

Rules:
- Sentiment must be one of: "positive", "neutral", "negative"
- Score must be a number:
  - > 0 for positive
  - = 0 for neutral
  - < 0 for negative

Text to analyze:
"""${text}"""
`;

	try {
		const response = await ollama.chat({
			model: 'llama3',
			messages: [{ role: 'user', content: prompt }],
			stream: false
		});

		// Extract JSON using regex
		const match = response.message.content.match(/{[\s\S]+}/);
		if (!match) throw new Error("No valid JSON in response");

		const result = JSON.parse(match[0]);
		return json(result);
	} catch (err) {
		console.error('Ollama Error:', err);
		return json({ error: 'Analysis failed', details: err.message }, { status: 500 });
	}
}
