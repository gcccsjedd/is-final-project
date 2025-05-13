import { json } from "@sveltejs/kit";
import type { RequestHandler } from "../$types";
import { analyzeSentiment } from "./util";
import Groq from "groq-sdk";

export const GET: RequestHandler = async () => {
	return json({});
};

export const POST: RequestHandler = async ({ request }) => {
	// the api key is explicitly set here for testing purposes
	// in production, it should be set in the environment variables
	// and not hardcoded in the codebase

	// para d ka na po sir gumawa ng api key
	//  "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"

	const client = new Groq({
		apiKey: process.env.GROQ_API_KEY || "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",
	});

	try {
		const { text } = await request.json();

		if (!text) {
			return json({ error: "Text is required" }, { status: 400 });
		}

		const prompt = `
			Analyze the sentiment of this text and provide a precise analysis. Consider:
			1. Overall sentiment (very positive, positive, slightly positive, neutral, slightly negative, negative, very negative)
			2. Brief reason (1-2 sentences)
			3. Score (0-100, where 0 is extremely negative and 100 is extremely positive)
			
			Text: "${text}"
			
			Be precise in your sentiment assessment and score. Format your response with clearly labeled sections like "Sentiment: negative", "Reason: ...", "Score: 20"
		`;

		const response = await client.chat.completions.create({
			messages: [{ role: "user", content: prompt }],
			model: "gemma2-9b-it",
			temperature: 0.5,
			stream: false,
			stop: null,
		});

		const result = response.choices[0].message.content;

		const sentiment = analyzeSentiment(result || "");

		return sentiment;
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
