import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { analyzeSentimentWithGemini, generateSummaryWithGeminiStream, getAverageScore } from "$lib/server/model";
import { insertSentimentAnalysis } from "$lib/server/db";

const SentimentAnalysisSchema = z.union([
	z
		.object({
			text: z.string().nonempty(),
			account_id: z.string().optional(),
			account_key: z.string().optional(),
		})
		.refine((data) => (data.account_id && data.account_key) || (!data.account_id && !data.account_key), {
			message: "Both account_id and account_key must be provided together",
		}),
	z
		.object({
			texts: z.array(z.string().nonempty()),
			account_id: z.string().optional(),
			account_key: z.string().optional(),
		})
		.refine((data) => (data.account_id && data.account_key) || (!data.account_id && !data.account_key), {
			message: "Both account_id and account_key must be provided together",
		}),
]);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const result = SentimentAnalysisSchema.safeParse(data);

		if (!result.success) {
			return json({ error: "Invalid input", details: result.error.format() }, { status: 400 });
		}

		const { account_id, account_key } = result.data;

		let analysisResults: { sentiment: string; score: number }[] = [];
		let summaryResults: string[] = [];
		let overallAnalysisResult: { sentiment: string; score: number } | null = null;
		let averageSentiment: number = 0;

		if ("text" in result.data) {
			const text = result.data.text;
			const analysisResult = await analyzeSentimentWithGemini(text);
			const summaryResult = await generateSummaryWithGeminiStream(text);

			analysisResults.push(analysisResult);
			summaryResults.push(summaryResult.summary);
			overallAnalysisResult = analysisResult;

			// Save to DB only if both account_id and account_key are provided
			if (account_id && account_key) {
				await insertSentimentAnalysis({
					account_id: account_id,
					account_key: account_key,
					sentiment: analysisResult.sentiment,
					score: analysisResult.score,
					summary: summaryResult.summary,
				});
			}

			return json({
				success: true,
				analysis: analysisResults,
				summary: summaryResults,
			});
		} else if ("texts" in result.data) {
			const texts = result.data.texts;
			const analysisPromises = texts.map((t) => analyzeSentimentWithGemini(t));
			analysisResults = await Promise.all(analysisPromises);

			overallAnalysisResult = await analyzeSentimentWithGemini(texts.join(" "));
			averageSentiment = getAverageScore(analysisResults);
			const summaryResult = await generateSummaryWithGeminiStream(texts.join(" "));
			summaryResults = [summaryResult.summary];

			// Save each analysis result only if both keys are provided
			if (account_id && account_key) {
				for (const analysisResult of analysisResults) {
					await insertSentimentAnalysis({
						account_id: account_id,
						account_key: account_key,
						sentiment: analysisResult.sentiment,
						score: analysisResult.score,
						summary: summaryResult.summary,
					});
				}
			}

			return json({
				success: true,
				analysis: analysisResults,
				overall: {
					sentiment: overallAnalysisResult.sentiment,
					score: averageSentiment,
				},
				summary: summaryResults,
			});
		}

		return json({ error: "Missing 'text' or 'texts'" }, { status: 400 });
	} catch (error) {
		console.error("Error:", error);
		return json(
			{
				error: "Failed to analyze and store sentiment",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
