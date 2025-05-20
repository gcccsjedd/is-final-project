import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "$env/dynamic/private";
import { getSentimentsByAccountId, supabase } from "./db";

const model = new GoogleGenerativeAI(env.GENAI_API_KEY).getGenerativeModel({ model: "gemma-3-12b-it" });

export async function analyzeSentimentWithGemini(text: string): Promise<{ sentiment: string; score: number }> {
	if (!model) {
		throw new Error("Gemini API key not configured.");
	}

	const prompt = `Analyze the sentiment of the following text:

"${text}"

Respond strictly in this JSON format (do NOT include markdown or backticks):

{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "score": number // an integer from 1 (very negative) to 100 (very positive), with 50 as neutral
}`;

	try {
		const result = await model.generateContent(prompt);
		let responseText = result.response.text().trim();
		console.log("Gemini response:", responseText);

		// Strip code fences if present
		if (responseText.startsWith("```")) {
			responseText = responseText
				.replace(/```(?:json)?\n?/, "")
				.replace(/```$/, "")
				.trim();
		}

		const parsed = JSON.parse(responseText);

		if (!parsed || typeof parsed.sentiment !== "string" || typeof parsed.score !== "number") {
			throw new Error("Invalid format from Gemini.");
		}

		return {
			sentiment: parsed.sentiment,
			score: parsed.score,
		};
	} catch (error: unknown) {
		console.error("Error analyzing sentiment with Gemini:", error);
		if (error instanceof Error) {
			throw new Error(`Failed to analyze sentiment using Gemini: ${error.message}`);
		} else {
			throw new Error("Failed to analyze sentiment using Gemini: Unknown error");
		}
	}
}

export async function generateSummaryWithGeminiStream(text: string): Promise<{ summary: string }> {
	if (!model) {
		throw new Error("Gemini API key not configured.");
	}

	const prompt = `Summarize the following text:

"${text}"

Respond strictly in this JSON format (do NOT include markdown or backticks):

{
  "summary": string
}`;

	try {
		const result = await model.generateContent(prompt);
		let responseText = result.response.text().trim();
		console.log("Gemini response:", responseText);

		// Strip code fences if present
		if (responseText.startsWith("```")) {
			responseText = responseText
				.replace(/```(?:json)?\n?/, "")
				.replace(/```$/, "")
				.trim();
		}

		const parsed = JSON.parse(responseText);

		if (!parsed || typeof parsed.summary !== "string") {
			throw new Error("Invalid format from Gemini.");
		}

		return {
			summary: parsed.summary,
		};
	} catch (error: unknown) {
		console.error("Error generating summary with Gemini:", error);
		if (error instanceof Error) {
			throw new Error(`Failed to generate summary using Gemini: ${error.message}`);
		} else {
			throw new Error("Failed to generate summary using Gemini: Unknown error");
		}
	}
}

//Function for getting the average score of the sentiment analysis
export function getAverageScore(analysisResults: { sentiment: string; score: number }[]): number {
	if (analysisResults.length === 0) {
		return 0;
	}

	const totalScore = analysisResults.reduce((acc, result) => acc + result.score, 0);
	return totalScore / analysisResults.length;
}

type SentimentReport = {
	trend?: string;
	average_score?: number;
	detailed_report?: string;
	recommendations?: string;
	error?: string;
	raw?: string;
};

export async function generateReportforAllSentiments(account_id: string, account_key: string): Promise<{ report: SentimentReport }> {
	// report is now a JSON object, not string
	if (!model) {
		throw new Error("Gemini API key not configured.");
	}

	const { data: account, error: accountError } = await supabase
		.from("accounts")
		.select("*")
		.eq("id", account_id)
		.eq("account_key", account_key)
		.single();

	if (accountError || !account) {
		throw new Error("Invalid account ID or key.");
	}

	const sentiments = await getSentimentsByAccountId(account.id);
	if (!sentiments || sentiments.length === 0) {
		throw new Error("No sentiments found for the account.");
	}

	const sentimentTexts = sentiments.map((s) => s.summary || s.text || "").join("\n\n");
	const scores = sentiments.map((s) => s.score);
	const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

	const prompt = `
You are an AI assistant that summarizes sentiment data. Given the following sentiment summaries and their scores, generate a JSON object with the following fields:

{
  "trend": "<overall sentiment trend: positive, neutral, or negative based on average score. Check on the date to determine the trend>",
  "average_score": <average numerical sentiment score>,
  "detailed_report": "<a detailed textual summary analyzing the sentiments. Include any notable trends, patterns, or anomalies.>",
  "recommendations": "<suggestions or insights based on the sentiment data>"
}

Sentiment Summaries:
${sentimentTexts}

Average Score: ${averageScore.toFixed(2)}

Generate the JSON only. Do not add any explanation or text outside the JSON.
`;

	const response = await model.generateContent(prompt);
	const rawReport = (await response.response.text()).trim();

	// Clean any wrapping markdown ticks if present
	const cleaned = rawReport
		.replace(/^```json\s*/, "")
		.replace(/```$/, "")
		.trim();

	try {
		const jsonReport = JSON.parse(cleaned);
		return { report: jsonReport };
	} catch {
		// Return fallback JSON object with raw text if parsing failed
		return {
			report: {
				error: "Failed to parse JSON from AI response",
				raw: cleaned,
			},
		};
	}
}
