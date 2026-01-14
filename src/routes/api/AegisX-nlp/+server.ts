import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// ollama config
const OLLAMA_HOST = "http://localhost:11434";
const MODEL_NAME = "llama3.1:latest";

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text } = await request.json();

		// parse and validate the incoming json
		if (!text || typeof text !== "string") {
			// return if no text or is not a string
			return json({ error: 'Invalid input: "text" field required' }, { status: 400 });
		}

		// prompt engineering!!!!
		const prompt = `
        You are an advanced sentiment analysis API. Analyze the following text and respond ONLY with valid JSON (no extra text). Follow these rules exactly:

        1. Use this exact JSON structure:
        {
            "sentiment": "positive|neutral|negative",
            "confidence": 0.00-1.00,
            "analysis": "detailed explanation (at least 1 sentence) citing specific words or phrases",
            "key_phrases": ["phrase1", "phrase2", "..."], 
            "tones": ["joy", "anger", "..."]
        }

        2. “sentiment” must be one of: positive, neutral, negative.  
        3. “confidence” must be a float between 0.00 and 1.00.  
        4. “analysis” should be a deep dive—mention at least two specific terms or expressions from the text and explain how they influence your sentiment decision.  
        5. “key_phrases” should list the top 3–5 words or short phrases that most strongly drove your classification.  
        6. “tones” should list up to 3 distinct emotional tones or attitudes you detect (e.g. “sarcasm,” “hopeful,” “skeptical”).  

        Text to analyze:
        """${text}"""
        `;

		// ollama api
		const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: MODEL_NAME,
				prompt: prompt,
				stream: false,
				format: "json",
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama API error: ${response.statusText}`);
		}

		// console llm json-wrapped result
		const result = await response.json();
		console.log("Raw Ollama response:", result);

		let sentimentResult;
		try {
			// cleaning the response before/after the json
			const jsonStr = result.response
				.trim()
				.replace(/^[^{]*/, "") // remove anything before {
				.replace(/[^}]*$/, ""); // Rrmove anything after }

			// parse the cleaned string into an object
			sentimentResult = JSON.parse(jsonStr);

			// valdiating the structure & types
			if (
				// must be exactly postive, negative, or neutral
				!["positive", "neutral", "negative"].includes(sentimentResult.sentiment) ||
				// confidence value must be a number
				typeof sentimentResult.confidence !== "number" ||
				// must be within 0 and 1
				sentimentResult.confidence < 0 ||
				sentimentResult.confidence > 1 ||
				// analysis must be in string
				typeof sentimentResult.analysis !== "string"
			) {
				throw new Error("Invalid response structure");
			}
		} catch (e) {
			console.error("Validation error:", e, "Raw response:", result.response);
			throw new Error("Invalid response format from AI");
		}

		// if the condition is not found or confidence is zero or null, throw error
		if (!sentimentResult.sentiment || !sentimentResult.confidence) {
			throw new Error("Invalid sentiment result and confidence");
		}

		// return cleaned and sentiment json
		return json(sentimentResult);
	} catch (error) {
		console.error("Sentiment analysis error:", error);
		const message = error instanceof Error ? error.message : "Internal server error";
		return json({ error: message }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Extract text from query parameters
		const url = new URL(request.url);
		const text = url.searchParams.get("text");

		// parse and validate the incoming json
		if (!text || typeof text !== "string") {
			// return if no text or is not a string
			return json({ error: 'Invalid input: "text" field required' }, { status: 400 });
		}

		// prompt engineering!!!!
		const prompt = `
        You are an advanced sentiment analysis API. Analyze the following text and respond ONLY with valid JSON (no extra text). Follow these rules exactly:

        1. Use this exact JSON structure:
        {
            "sentiment": "positive|neutral|negative",
            "confidence": 0.00-1.00,
            "analysis": "detailed explanation (at least 1 sentence) citing specific words or phrases",
            "key_phrases": ["phrase1", "phrase2", "..."], 
            "tones": ["joy", "anger", "..."]
        }

        2. “sentiment” must be one of: positive, neutral, negative.  
        3. “confidence” must be a float between 0.00 and 1.00.  
        4. “analysis” should be a deep dive—mention at least two specific terms or expressions from the text and explain how they influence your sentiment decision.  
        5. “key_phrases” should list the top 3–5 words or short phrases that most strongly drove your classification.  
        6. “tones” should list up to 3 distinct emotional tones or attitudes you detect (e.g. “sarcasm,” “hopeful,” “skeptical”).  

        Text to analyze:
        """${text}"""
        `;

		// ollama api
		const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: MODEL_NAME,
				prompt: prompt,
				stream: false,
				format: "json",
			}),
		});

		if (!response.ok) {
			throw new Error(`Ollama API error: ${response.statusText}`);
		}

		// console llm json-wrapped result
		const result = await response.json();
		console.log("Raw Ollama response:", result);

		let sentimentResult;
		try {
			// cleaning the response before/after the json
			const jsonStr = result.response
				.trim()
				.replace(/^[^{]*/, "") // remove anything before {
				.replace(/[^}]*$/, ""); // Rrmove anything after }

			// parse the cleaned string into an object
			sentimentResult = JSON.parse(jsonStr);

			// valdiating the structure & types
			if (
				// must be exactly postive, negative, or neutral
				!["positive", "neutral", "negative"].includes(sentimentResult.sentiment) ||
				// confidence value must be a number
				typeof sentimentResult.confidence !== "number" ||
				// must be within 0 and 1
				sentimentResult.confidence < 0 ||
				sentimentResult.confidence > 1 ||
				// analysis must be in string
				typeof sentimentResult.analysis !== "string"
			) {
				throw new Error("Invalid response structure");
			}
		} catch (e) {
			console.error("Validation error:", e, "Raw response:", result.response);
			throw new Error("Invalid response format from AI");
		}

		// if the condition is not found or confidence is zero or null, throw error
		if (!sentimentResult.sentiment || !sentimentResult.confidence) {
			throw new Error("Invalid sentiment result and confidence");
		}

		// return cleaned and sentiment json
		return json(sentimentResult);
	} catch (error) {
		console.error("Sentiment analysis error:", error);
		const message = error instanceof Error ? error.message : "Internal server error";
		return json({ error: message }, { status: 500 });
	}
};