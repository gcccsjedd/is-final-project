import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { analyzeSentimentWithGemini, generateSummaryWithGeminiStream, getAverageScore } from "$lib/server/model";

const SentimentAnalysisSchema = z.union([
	z.object({
		text: z.string().min(1).max(5000),
	}),
	z.object({
		texts: z.array(z.string().min(1).max(5000)).nonempty(),
	}),
]);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const result = SentimentAnalysisSchema.safeParse(data);

		if (!result.success) {
			return json({ error: "Invalid input", details: result.error.format() }, { status: 400 });
		}

		let analysisResults: { sentiment: string; score: number }[] = [];
		let summaryResults: unknown[] = [];
		let overallAnalysisResult: { sentiment: string; score: number } | null = null;
		let averageSentiment: number = 0;

		if ("text" in result.data) {
			// Single text case
			const text = result.data.text;
			const analysisResult = await analyzeSentimentWithGemini(text);
			const summaryResult = await generateSummaryWithGeminiStream(text);

			analysisResults.push(analysisResult);
			summaryResults.push(summaryResult.summary);
			overallAnalysisResult = analysisResult;
			return json({
				success: true,
				analysis: analysisResults,
				summary: summaryResults,
			});
		} else if ("texts" in result.data) {
			// Multiple texts case
			const texts = result.data.texts;
			const analysisPromises = texts.map((t) => analyzeSentimentWithGemini(t));

			analysisResults = await Promise.all(analysisPromises);

			// Overall sentiment for all texts combined
			overallAnalysisResult = await analyzeSentimentWithGemini(texts.join(" "));
			averageSentiment = getAverageScore(analysisResults);

			// Summary for combined text
			const summaryResult = await generateSummaryWithGeminiStream(texts.join(" "));
			summaryResults = [summaryResult.summary];

			return json({
				success: true,
				analysis: analysisResults,
				overall: {
					sentiment: overallAnalysisResult?.sentiment,
					score: averageSentiment,
				},
				summary: summaryResults,
			});
		}

		// If neither "text" nor "texts" is present, return a 400 error
		return json({ error: "Invalid input: missing 'text' or 'texts' property" }, { status: 400 });
	} catch (error) {
		console.error("Error processing sentiment analysis request:", error);
		return json(
			{
				error: "Failed to analyze sentiment",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};

