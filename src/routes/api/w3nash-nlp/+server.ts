import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { ollama } from "ollama-ai-provider";
import { generateText } from "ai";
import {
	nlpRequestSchema,
	type NlpRequest,
	type SummarizeResponse,
	type SentimentResponse,
	type EntitiesResponse,
	type KeywordsResponse,
} from "./schema";

// Initialize Ollama model - llama3 is the model we're using
const ollamaModel = ollama("llama3");

// Helper function to extract JSON from text that might have additional content
function extractJSON(text: string): string {
	// Try to find content between {} brackets, accounting for nested structures
	try {
		// First look for code blocks with ```json ... ``` format
		const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
		const codeBlockMatch = text.match(codeBlockRegex);

		if (codeBlockMatch && codeBlockMatch[1]) {
			// Found a code block, use its content
			return balanceJSONBrackets(codeBlockMatch[1].trim());
		}

		// No code block found, try to extract JSON directly
		// Start by looking for the first { and last }
		const firstBrace = text.indexOf("{");

		if (firstBrace !== -1) {
			// Extract the substring starting from the first brace
			const potentialJson = text.substring(firstBrace);
			return balanceJSONBrackets(potentialJson);
		}

		// If we can't find braces, return the original text
		return text;
	} catch {
		// If any error occurs during extraction, return the original text
		return text;
	}
}

// Helper function to balance JSON brackets if they're missing
function balanceJSONBrackets(json: string): string {
	let bracketCount = 0;
	let squareBracketCount = 0;
	let inString = false;
	let escaped = false;

	// Count opened but not closed brackets
	for (let i = 0; i < json.length; i++) {
		const char = json[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === "\\" && inString) {
			escaped = true;
			continue;
		}

		if (char === '"' && !escaped) {
			inString = !inString;
			continue;
		}

		if (!inString) {
			if (char === "{") bracketCount++;
			else if (char === "}") bracketCount--;
			else if (char === "[") squareBracketCount++;
			else if (char === "]") squareBracketCount--;
		}
	}

	// Add missing closing brackets/braces
	let result = json;

	// Add missing square brackets
	for (let i = 0; i < squareBracketCount; i++) {
		result += "]";
	}

	// Add missing curly braces
	for (let i = 0; i < bracketCount; i++) {
		result += "}";
	}

	return result;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse request body
		const requestData = await request.json();

		// Validate request against schema
		const result = nlpRequestSchema.safeParse(requestData);
		if (!result.success) {
			return json(
				{
					error: "Invalid request data",
					details: result.error.format(),
				},
				{ status: 400 },
			);
		}

		const data = result.data as NlpRequest;

		// Process based on requested operation
		switch (data.operation) {
			case "summarize":
				return await handleSummarize(data);
			case "analyze-sentiment":
				return await handleSentiment(data);
			case "extract-entities":
				return await handleEntities(data);
			case "generate-keywords":
				return await handleKeywords(data);
			default:
				return json({ error: "Unsupported operation" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error processing request:", error);
		return json(
			{
				error: "Failed to process request",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};

async function handleSummarize(data: NlpRequest): Promise<Response> {
	const { text, options } = data;
	const maxLength = options?.maxLength || Math.max(100, Math.floor(text.length * 0.3));

	const prompt = `Summarize the following text in about ${maxLength} characters:

  ${text}

  Provide a concise, informative summary that captures the main points. Return only the summary text with no additional formatting or explanation.`;

	try {
		const result = await generateText({
			model: ollamaModel,
			prompt,
		});

		const response: SummarizeResponse = {
			summary: result.text,
			originalLength: text.length,
			summaryLength: result.text.length,
		};

		return json(response);
	} catch (error) {
		console.error("Summarization error:", error);
		return json(
			{
				error: "Failed to summarize text",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

async function handleSentiment(data: NlpRequest): Promise<Response> {
	const { text, options } = data;
	const detailLevel = options?.detailLevel || "basic";

	const prompt = `Analyze the sentiment of the following text.

  IMPORTANT: Return ONLY a valid JSON object with these exact fields:
  {
    "sentiment": "positive"|"negative"|"neutral",
    "score": <number between -1 and 1>,
    "confidence": <number between 0 and 1>
    ${detailLevel === "detailed" ? ',"analysis": "<brief explanation of sentiment>"' : ""}
  }

  DO NOT include any explanation, markdown formatting, or code block markers. ONLY return the JSON object.

  Text: "${text}"`;

	try {
		const result = await generateText({
			model: ollamaModel,
			prompt,
		});

		try {
			// Extract and parse the LLM output as JSON
			const jsonText = extractJSON(result.text);
			const sentimentData = JSON.parse(jsonText) as SentimentResponse;
			return json(sentimentData);
		} catch {
			// Fallback in case LLM doesn't return valid JSON
			return json({
				sentiment: "neutral",
				score: 0,
				confidence: 0.5,
				error: "Failed to parse sentiment analysis",
			});
		}
	} catch (error) {
		console.error("Sentiment analysis error:", error);
		return json(
			{
				error: "Failed to analyze sentiment",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

async function handleEntities(data: NlpRequest): Promise<Response> {
	const { text } = data;

	const prompt = `Extract named entities from the following text.

  IMPORTANT: Return ONLY a valid JSON object with the following format:
  {
    "entities": [
      { "text": "<entity name>", "type": "<entity type>", "confidence": <number between 0 and 1> }
    ]
  }

  Entity types should be one of: person, organization, location, date, or other.
  DO NOT include any explanation, markdown formatting, or code block markers. ONLY return the JSON object.

  Text: "${text}"`;

	try {
		const result = await generateText({
			model: ollamaModel,
			prompt,
		});

		try {
			// Extract and parse the LLM output as JSON
			const jsonText = extractJSON(result.text);
			console.log("Extracted JSON:", jsonText);
			const entitiesData = JSON.parse(jsonText) as EntitiesResponse;
			console.log("Parsed entities data:", entitiesData);
			return json(entitiesData);
		} catch {
			// Fallback in case LLM doesn't return valid JSON
			return json({
				entities: [],
				error: "Failed to parse entity extraction",
			});
		}
	} catch (error) {
		console.error("Entity extraction error:", error);
		return json(
			{
				error: "Failed to extract entities",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

async function handleKeywords(data: NlpRequest): Promise<Response> {
	const { text } = data;

	const prompt = `Extract the most important keywords from the following text.

  IMPORTANT: Return ONLY a valid JSON object with the following format:
  {
    "keywords": [
      { "text": "<keyword>", "relevance": <number between 0 and 1> }
    ]
  }

  DO NOT include any explanation, markdown formatting, or code block markers. ONLY return the JSON object.

  Text: "${text}"`;

	try {
		const result = await generateText({
			model: ollamaModel,
			prompt,
		});

		try {
			// Extract and parse the LLM output as JSON
			const jsonText = extractJSON(result.text);
			const keywordsData = JSON.parse(jsonText) as KeywordsResponse;
			return json(keywordsData);
		} catch {
			// Fallback in case LLM doesn't return valid JSON
			return json({
				keywords: [],
				error: "Failed to parse keyword extraction",
			});
		}
	} catch (error) {
		console.error("Keyword extraction error:", error);
		return json(
			{
				error: "Failed to extract keywords",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
