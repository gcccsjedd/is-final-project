import { json } from "@sveltejs/kit";
import { Ollama } from "ollama";
import { validateTasks } from "./validate";
import { sortTasks } from "./sortTask";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { tasks } = await request.json();
        if (!tasks) {
            return json({ error: "Missing tasks array in request body" }, { status: 400 });
        }

        // Validate task format
        const validationError = validateTasks(tasks);
        if (validationError) {
            return json({ error: validationError.error }, { status: 400 });
        }

        // Sort tasks
        const sortedTasks = sortTasks(tasks);

        // 🔹 AI Model Configuration (DeepSeek-R1 7B)
        const ollamaModel = "deepseek-r1:7b"; // Ensure correct model tag

        // AI Prompt Refinement
        const ollamaPrompt = `Rank these tasks based on urgency, importance, and deadlines:\n${JSON.stringify(sortedTasks)}
        Provide reasoning behind each priority level and suggest potential improvements.`;

        // 🔹 Call Ollama AI with Model Specification
        const ollamaResponse = await new Ollama().generate({ model: ollamaModel, prompt: ollamaPrompt });

        if (!ollamaResponse || !ollamaResponse.response) {
            return json({ error: "Ollama returned an empty response." }, { status: 500 });
        }

        // 🔹 Convert Ollama response to a clean string
        const ollamaAnalysisString = typeof ollamaResponse.response === "object"
            ? JSON.stringify(ollamaResponse.response, null, 2) // Converts object to formatted JSON string
            : ollamaResponse.response.toString().trim(); // Converts raw text to string

        // 🔹 Regex Cleanup for `<think>` Blocks
        const cleanResponse = ollamaAnalysisString.replace(/^[\s\S]*<\/think>(?![\s\S]*<\/think>)/g, '').trim();

        return json({
            prioritized_tasks: sortedTasks,
            ollama_analysis: cleanResponse // 🔹 Now properly formatted as a string
        }, { status: 200 });


    } catch (error) {
        console.error("Error processing task prioritization:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};
