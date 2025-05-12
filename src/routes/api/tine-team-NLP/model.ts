export async function analyzeText(text: string) {
	const prompt = `You are a Sentiment and Emotion Analysis AI. Analyze the following text:

"""${text}"""

Respond ONLY with a valid JSON object like this:

{
  "sentiment": "positive | negative | neutral",
  "emotion": "joy | sadness | anger | fear | surprise | disgust",
  "confidence": {
    "sentiment": float (0-1),
    "emotion": float (0-1)
  }
}

Do NOT include any explanation. Only return the JSON.`;

	const response = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: "llama2",
			prompt,
			stream: false,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error("Ollama Error:", errorText);
		throw new Error(`Ollama error: ${response.status} ${response.statusText} - ${errorText}`);
	}

	const result = await response.json();
	const parsed = JSON.parse(result.response.trim());
	return parsed;
}
