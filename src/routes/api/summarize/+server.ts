import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { Ollama } from "ollama";

// handles post requests for text summarization
export const POST: RequestHandler = async ({ request }) => {
    try {
        // get content-type header
        const content_type = request.headers.get("Content-Type");
        // parse json body
        const { text, max_length } = await request.json();

        // check if content-type is application/json
        if (content_type !== "application/json") {
            return json({ error: 'unsupported content-type. please use "application/json".' }, { status: 400 });
        }

        // check if 'text' is valid
        if (!text || typeof text !== "string") {
            return json({ error: "invalid or missing text" }, { status: 400 });
        }

        // check if 'max_length' is a number if provided
        if (max_length && typeof max_length !== "number") {
            return json({ error: "invalid max_length. please provide a number." }, { status: 400 });
        }

        // set summary length limit (default is 100)
        const length_limit = max_length && typeof max_length === "number" ? max_length : 100;

        // create ollama client
        const ollama = new Ollama();

    // build prompt for summarization
    const prompt = `
    summarize the following text clearly and concisely in no more than ${length_limit} words. focus on the main ideas and key points only.

    text:
    "${text}"

    return only the summary, without any extra explanation or introduction.
    `;

        // call ollama api to generate summary
        const response = await ollama.generate({
            model: "tinyllama",
            prompt,
        });

        // get summary from response
        const summary = response.response?.trim() || "";
        if (!summary) throw new Error("empty response from ollama");

        // return summary and info as json
        return json({
            summary,
            original_text: text,
            set_max_length: length_limit,
        });
    } catch (error) {
        // handle errors and return error message
        console.error("error in summarize:", error);
        const error_message = error instanceof Error ? error.message : "unknown error";
        return json({ error: "internal server error", details: error_message }, { status: 500 });
    }
};