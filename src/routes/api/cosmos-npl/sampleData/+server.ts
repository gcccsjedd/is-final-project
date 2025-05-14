import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	const sampleData = {
		message: "This is the AI Text Summarizer API",
		timestamp: new Date().toISOString(),
		endpoints: [
			{
				path: "/cosmos-npl",
				method: "POST",
				description: "Summarizes input text using the local DeepSeek model via Ollama",
				request_body: {
					text: "Required. The text to summarize."
				},
			}
		],
	};

	return json(sampleData);
};
