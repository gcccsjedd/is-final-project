import { json, type RequestHandler } from "@sveltejs/kit";
import { Ollama } from "ollama";

export const POST: RequestHandler = async ({ request }) => {
    const ollama = new Ollama({ host: "http://localhost:11434" });

    try {
        const body = await request.json();
        const inputText = body.text || "";

        if (!inputText.trim()) {
            return json({ success: false, error: "Text cannot be empty" }, { status: 400 });
        }

        const response = await ollama.chat({
            model: "deepseek-r1:1.5b",
            messages: [
                {
                    role: "system",
                    content: "Summarize the following text in 2-3 clear sentences. Do not include internal thoughts or reasoning steps—only the final summary."
                },
                {
                    role: "user",
                    content: inputText
                }
            ],
            options: {
                temperature: 0.2,
                num_ctx: 2048,
                top_p: 0.8,
                repeat_penalty: 1.2
            }
        });

        const summary = response.message?.content?.trim() ?? "";

        return json({
            success: true,
            summary,
            model: "deepseek-r1:1.5b",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Summarizer API Error:", error);
        return json(
            {
                success: false,
                error: "Failed to process request",
                details: error instanceof Error ? error.message : String(error),
                suggestion: "Check if Ollama is running and the model is loaded"
            },
            { status: 500 }
        );
    }
};
