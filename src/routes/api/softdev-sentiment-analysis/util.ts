import { json } from "@sveltejs/kit";

export const analyzeSentiment = (text: string) => {
	const sentimentResponse = text;

	// Improved pattern matching for sentiment extraction
	const sentimentMatch =
		sentimentResponse.match(/sentiment:\s*(very positive|positive|slightly positive|neutral|slightly negative|negative|very negative)/i) ||
		sentimentResponse.match(/(very positive|positive|slightly positive|neutral|slightly negative|negative|very negative)\s*sentiment/i) ||
		sentimentResponse.match(/overall.*?(very positive|positive|slightly positive|neutral|slightly negative|negative|very negative)/i);

	const scoreMatch =
		sentimentResponse.match(/score:\s*(\d+)/i) || sentimentResponse.match(/(\d+)\s*\/\s*100/i) || sentimentResponse.match(/rated.*?(\d+)/i);

	let sentiment = "Neutral";
	let score = 0.5;

	// Content-based keyword detection for strongly negative content
	const negativeKeywords = [
		"tragic",
		"death",
		"died",
		"killed",
		"accident",
		"disaster",
		"fire",
		"fatal",
		"victim",
		"grief",
		"mourning",
		"catastrophe",
		"devastat",
		"suicide",
		"murder",
		"assault",
		"trauma",
		"heartbreak",
		"crisis",
		"terrible",
		"horrible",
		"awful",
		"worst",
		"suffer",
		"misery",
	];

	// Content-based keyword detection for strongly positive content
	const positiveKeywords = [
		"amazing",
		"excellent",
		"outstanding",
		"wonderful",
		"fantastic",
		"brilliant",
		"triumph",
		"success",
		"achievement",
		"celebrate",
		"breakthrough",
		"inspiring",
		"delightful",
		"joyful",
		"happy",
		"thrilled",
		"ecstatic",
		"perfect",
		"extraordinary",
		"remarkable",
		"innovative",
		"revolutionary",
		"incredible",
		"impressive",
		"awesome",
		"grateful",
		"blessing",
		"love",
		"praise",
		"award",
		"victory",
	];

	const lowercaseText = text.toLowerCase();
	const negativeKeywordMatches = negativeKeywords.filter((keyword) => lowercaseText.includes(keyword.toLowerCase()));

	const positiveKeywordMatches = positiveKeywords.filter((keyword) => lowercaseText.includes(keyword.toLowerCase()));

	// Determine content sentiment based on keyword density
	const hasStrongNegativeContent =
		negativeKeywordMatches.length >= 2 ||
		lowercaseText.includes("death") ||
		lowercaseText.includes("died") ||
		lowercaseText.includes("killed") ||
		lowercaseText.includes("tragic");

	const hasStrongPositiveContent =
		positiveKeywordMatches.length >= 2 ||
		lowercaseText.includes("amazing") ||
		lowercaseText.includes("breakthrough") ||
		lowercaseText.includes("excellent") ||
		lowercaseText.includes("outstanding");

	// Detect celebratory language patterns
	const hasCelebratoryLanguage = /celebrat(e|ion|ing)|achievement|award|honor|milestone|breakthrough|success story/.test(lowercaseText);

	// Calculate keyword density for both positive and negative
	const negativeKeywordDensity = negativeKeywordMatches.length / text.split(" ").length;
	const positiveKeywordDensity = positiveKeywordMatches.length / text.split(" ").length;

	if (sentimentMatch) {
		const rawSentiment = sentimentMatch[1].toLowerCase();
		// Convert detailed sentiment to basic sentiment for display
		sentiment = rawSentiment.includes("positive") ? "Positive" : rawSentiment.includes("negative") ? "Negative" : "Neutral";

		// Set score based on detailed sentiment
		switch (rawSentiment) {
			case "very positive":
				score = 0.95;
				break;
			case "positive":
				score = 0.8;
				break;
			case "slightly positive":
				score = 0.65;
				break;
			case "neutral":
				score = 0.5;
				break;
			case "slightly negative":
				score = 0.35;
				break;
			case "negative":
				score = 0.2;
				break;
			case "very negative":
				score = 0.05;
				break;
		}
	}

	// Override sentiment based on content analysis
	if (hasStrongNegativeContent && !hasStrongPositiveContent) {
		sentiment = "Negative";
		score = negativeKeywordMatches.length >= 3 ? 0.1 : 0.2; // More keywords = more negative
	} else if (hasStrongPositiveContent && !hasStrongNegativeContent) {
		sentiment = "Positive";
		// Calculate positive score based on keyword density and celebratory language
		score = 0.8 + positiveKeywordMatches.length * 0.02;
		if (hasCelebratoryLanguage) score += 0.05;
		score = Math.min(score, 0.98); // Cap at 0.98
	} else if (hasStrongPositiveContent && hasStrongNegativeContent) {
		// Mixed sentiment, decide based on keyword density
		if (positiveKeywordDensity > negativeKeywordDensity) {
			sentiment = "Positive";
			score = 0.6 + 0.1 * (positiveKeywordDensity / (positiveKeywordDensity + negativeKeywordDensity));
		} else {
			sentiment = "Negative";
			score = 0.4 - 0.1 * (negativeKeywordDensity / (positiveKeywordDensity + negativeKeywordDensity));
		}
	}

	if (scoreMatch && !hasStrongNegativeContent && !hasStrongPositiveContent) {
		// Only use the score if not overridden by keyword analysis
		const rawScore = parseInt(scoreMatch[1]);
		// Convert 0-100 score to 0-1 range
		score = rawScore / 100;

		// Ensure score aligns with sentiment
		if (sentiment === "Negative" && score > 0.4) {
			score = 0.2; // Force lower score for negative sentiment
		} else if (sentiment === "Positive" && score < 0.6) {
			score = 0.7; // Ensure positive sentiment has higher scores
		}
	}

	// Extract the brief reason - improved pattern matching
	const reasonMatch =
		sentimentResponse.match(/reason:\s*([^.]+\.?[^.]*\.?)/i) ||
		sentimentResponse.match(/analysis:\s*([^.]+\.?[^.]*\.?)/i) ||
		sentimentResponse.match(/brief reason:\s*([^.]+\.?[^.]*\.?)/i) ||
		sentimentResponse.match(/text has a (.*?)\./i) ||
		sentimentResponse.match(/the text (.*?)\./i);

	let briefAnalysis = reasonMatch ? reasonMatch[1].trim() : "No specific reason provided.";

	// Generate reason if keywords were detected but no reason was found
	if (briefAnalysis === "No specific reason provided.") {
		if (hasStrongNegativeContent) {
			briefAnalysis = `The text contains negative elements including: ${negativeKeywordMatches.slice(0, 3).join(", ")}.`;
		} else if (hasStrongPositiveContent) {
			briefAnalysis = `The text contains positive elements including: ${positiveKeywordMatches.slice(0, 3).join(", ")}.`;
		} else if (hasStrongPositiveContent && hasStrongNegativeContent) {
			briefAnalysis = `The text contains mixed sentiment with both positive and negative elements.`;
		}
	}

	return json({
		sentiment,
		score,
		analysis: briefAnalysis,
	});
};
