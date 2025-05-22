import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, fetch }) => {
	const { text } = await request.json();

	if (!text?.trim()) {
		return json({ error: 'Text is required' }, { status: 400 });
	}

	try {
		const res = await fetch('/agent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text }) // No more task array
		});

		if (!res.ok) {
			const errorData = await res.json();
			return json({ error: errorData.error || 'Agent error' }, { status: res.status });
		}

		const data = await res.json();

		return json({
			summary: data.result || data.summary || data.outputs?.summary
		});
	} catch (err) {
		console.error(err);
		return json({ error: 'Summarization failed' }, { status: 500 });
	}
};
