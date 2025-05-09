import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import OpenAI from "openai";
import type { Project } from "../../../types";

//api key
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
	throw new Error("Environment variable VITE_OPENAI_API_KEY is not set.");
}

// openai client
const openai = new OpenAI({
	apiKey
});

// POST
export const POST: RequestHandler = async ({ request }) => {
	try{
		const body: Project = await request.json();
		const { name, type, teamSize, requirements } = body;

		// todo: openai generation, tapusin ko mamaya -aron

		return json({
			message: "Data received",
			project: {
				name,
				type,
				teamSize,
				requirements
			}
		});
	} catch (error) {
		console.error("POST handler error:", error);
		return json({ error: "Failed to process request" }, { status: 500 });
	}
};
