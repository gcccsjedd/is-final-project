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

        // Call Ollama AI with Model Specification
        const ollamaResponse = await new Ollama().generate({ model: ollamaModel, prompt: ollamaPrompt });

        return json({ prioritized_tasks: sortedTasks, ollama_analysis: ollamaResponse }, { status: 200 });

    } catch (error) {
        console.error("Error processing task prioritization:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};
