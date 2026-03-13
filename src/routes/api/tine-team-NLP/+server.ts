import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { analyzeText } from "./model";

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		if (!data?.text || typeof data.text !== "string" || data.text.trim() === "") {
			throw error(400, 'Invalid input. Please provide non-empty "text".');
		}

		const result = await analyzeText(data.text);
		return json(result);
	} catch (error) {
		console.error(error);
		return json({ error: "Failed to process input" }, { status: 500 });
	}
};
