import { json, error, type RequestEvent } from "@sveltejs/kit";
import { validate } from "jsonschema";
import { Ollama } from "ollama";

// Define the input schema inline (or import from schema.json if preferred)
const inputSchema = {
	type: "object",
	properties: {
		text: { type: "string", minLength: 50, maxLength: 5000 },
	},
	required: ["text"],
	additionalProperties: false,
} as const;

// Helper function for Ollama with timeout
const ollamaWithTimeout = async (options: { model: string; prompt: string; stream: false }, timeoutMs: number = 30000) => {
	const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Ollama request timed out")), timeoutMs));
	const ollamaClient = new Ollama();
	return Promise.race([ollamaClient.generate(options), timeout]);
};

export async function POST({ request }: RequestEvent): Promise<Response> {
	try {
		// Parse request body
		const body = await request.json();

		// Validate input against schema
		const validationResult = validate(body, inputSchema);
		if (!validationResult.valid) {
			throw new Error("Invalid input: " + validationResult.errors.map((e: any) => e.message).join(", "));
		}

		const text = body.text;
		const maxSummaryLength = 150; // Hardcoded default
		const maxKeyPhrases = 5; // Hardcoded default

		// Step 1: Summarize the text
		const summaryPrompt = `Summarize the following text in approximately ${maxSummaryLength} words:\n\n${text}`;
		const summaryResponse = await ollamaWithTimeout({
			model: "llama3",
			prompt: summaryPrompt,
			stream: false,
		});
		const summary = summaryResponse.response.trim();

		// Step 2: Perform sentiment analysis on the summary
		const sentimentPrompt = `Analyze the sentiment of the following text and classify it as Positive, Negative, or Neutral. Return only the sentiment label:\n\n${summary}`;
		const sentimentResponse = await ollamaWithTimeout({
			model: "llama3",
			prompt: sentimentPrompt,
			stream: false,
		});
		const sentiment = sentimentResponse.response.trim().toLowerCase();
		const normalizedSentiment = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);

		// Step 3: Extract key phrases from the summary
		const keyPhrasePrompt = `Extract up to ${maxKeyPhrases} key phrases from the following text. Return the phrases as a comma-separated list:\n\n${summary}`;
		const keyPhraseResponse = await ollamaWithTimeout({
			model: "llama3",
			prompt: keyPhrasePrompt,
			stream: false,
		});
		let keyPhrases: string[] = [];
		const trimmedKeyPhraseResponse = keyPhraseResponse.response.trim();
		if (trimmedKeyPhraseResponse) {
			keyPhrases = trimmedKeyPhraseResponse
				.split(",")
				.map((phrase: string) => phrase.trim())
				.filter((phrase: string) => phrase);
		}

		// Step 4: Categorize the summary
		const categoryPrompt = `Classify the following text into one of these categories: Product Review, News Article, Opinion Piece, or Other. Return only the category name:\n\n${summary}`;
		const categoryResponse = await ollamaWithTimeout({
			model: "llama3",
			prompt: categoryPrompt,
			stream: false,
		});
		const category = categoryResponse.response.trim().toLowerCase();
		const normalizedCategory = category
			.split(" ")
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		const entityPrompt = `Identify named entities (people, organizations, locations) in the following text. Respond ONLY with a JSON object with three keys: "people", "organizations", and "locations". Each key maps to an array of strings. If no entities found, use empty arrays.\n\nText:\n${summary}\n\nJSON ONLY:`;

		const entityResponse = await ollamaWithTimeout({
			model: "llama3",
			prompt: entityPrompt,
			stream: false,
		});

		function extractJSON(text: string): string | null {
			const jsonStart = text.indexOf("{");
			const jsonEnd = text.lastIndexOf("}");
			if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
				return text.slice(jsonStart, jsonEnd + 1);
			}
			return null;
		}

		let entities = { people: [], organizations: [], locations: [] };
		try {
			const jsonStr = extractJSON(entityResponse.response.trim());
			if (jsonStr) {
				entities = JSON.parse(jsonStr);
			}
		} catch {
			entities = { people: [], organizations: [], locations: [] };
		}

		// Return JSON response
		return json({
			success: true,
			summary,
			sentiment: normalizedSentiment,
			keyPhrases,
			category: normalizedCategory,
			entities,
			inputLength: text.length,
			summaryLength: summary.split(/\s+/).length,
		});
	} catch (err) {
		const errorMessage = err instanceof Error ? `Failed to process request: ${err.message}` : `Failed to process request: ${String(err)}`;
		throw error(400, errorMessage);
	}
}

export {};
