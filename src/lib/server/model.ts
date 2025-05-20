import { GoogleGenerativeAI } from "@google/generative-ai";

const model = new GoogleGenerativeAI(process.env.GENAI_API_KEY!).getGenerativeModel({ model: "gemma-3-12b-it" });

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
