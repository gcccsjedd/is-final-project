import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { analyzeSentimentWithGemini, generateSummaryWithGeminiStream } from "$lib/server/model";

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

		let analysisResults: unknown[] = [];
		let summaryResults: unknown[] = [];

		if ("text" in result.data) {
			// Single text case
			const text = result.data.text;
			const analysisResult = await analyzeSentimentWithGemini(text);
			const summaryResult = await generateSummaryWithGeminiStream(text);

			analysisResults.push(analysisResult);
			summaryResults.push(summaryResult.summary);
		} else if ("texts" in result.data) {
			// Multiple texts case - process all in parallel or sequentially
			const texts = result.data.texts;

			// For better performance, you can run in parallel:
			const analysisPromises = texts.map((t) => analyzeSentimentWithGemini(t));
			//Make a summary for the whole text as one
			const summaryPromises = generateSummaryWithGeminiStream(texts.join(" "));

			analysisResults = await Promise.all(analysisPromises);
			const summary = await summaryPromises;
			summaryResults = [summary.summary];
		}

		return json({
			success: true,
			analysis: analysisResults,
			summary: summaryResults,
		});
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
