import { json, type RequestHandler } from '@sveltejs/kit';
import { Ollama } from 'ollama';

export const POST: RequestHandler = async ({ request }) => {
	const { text } = await request.json();

	const ollama = new Ollama({ host: 'http://localhost:11434/' });

	const systemMessage =
		'You are a text summarization assistant. Please provide a short and concise summary of the following text while maintaining the key points and main ideas.';

	const chat = await ollama.chat({
		model: 'gemma3:4b',
		messages: [
			{
				role: 'system',
				content: systemMessage
			},
			{
				role: 'user',
				content: `Please summarize the following text: ${text}`
			}
		]
	});

	return json({ message: chat.message.content });
};
