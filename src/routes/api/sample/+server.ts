// src/routes/api/sample/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { ApiResponse, SampleResponse, ApiEndpoint } from '$lib/schemas/schema';

const getSampleData = (): SampleResponse => ({
    message: "This is a 404notfound-nlp API response",
    timestamp: new Date().toISOString(),
    endpoints: [
        {
            path: "/api/404notfound-nlp",
            method: "POST",
            description: "Get text summary using Mistral via OpenRouter",
            example_request: { text: "Summarize this article about AI" },
            example_response: { summary: "The article discusses recent advances in AI..." }
        },
        {
            path: "/api/sample",
            method: "GET",
            description: "Get API documentation",
            example_request: {},
            example_response: {}
        }
    ],
    note: "This API uses OpenRouter's free Mistral-7B model"
});

export const GET: RequestHandler = async () => {
    return json({ data: getSampleData() } satisfies ApiResponse<SampleResponse>);
};