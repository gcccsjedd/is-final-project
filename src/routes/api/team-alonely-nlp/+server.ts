import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';

export async function POST({ request }) {
	try {
		const { text } = await request.json();

		if (!text || typeof text !== 'string' || text.length < 20) {
			return json({ error: 'Input must be a string with at least 20 characters.' }, { status: 400 });
		}

		const summary = await new Promise((resolve, reject) => {
			const ollama = spawn('ollama', ['run', 'deepseek-r1']); 

			let result = '';
			ollama.stdout.on('data', (data) => {
				result += data.toString();
			});
			ollama.stderr.on('data', (data) => {
				console.error('stderr:', data.toString());
			});
			ollama.on('error', reject);
			ollama.on('close', (code) => {
				if (code !== 0) return reject(new Error(`Ollama exited with code ${code}`));

				const cleaned = result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
				resolve(cleaned);
			});

			// Custom summarization prompt
			ollama.stdin.write(`Summarize this text in a concise paragraph:\n\n${text}\n`);
			ollama.stdin.end();
		});

		return json({ summary });
	} catch (err) {
		console.error(err);
		return json({ error: 'Failed to summarize.' }, { status: 500 });
	}
}
