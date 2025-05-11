// src/routes/api/sample/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const sampleData = {
        message: "This is a sample API response",
        timestamp: new Date().toISOString(),
        endpoints: [
            {
                path: "/api/agent",
                method: "POST",
                description: "Process text with local Mistral instance",
                example_request: {
                    text: "Summarize this article about AI"
                },
                example_response: {
                    summary: "The article discusses recent advances in AI..."
                }
            }
        ],
        note: "This API expects a local Mistral instance running at http://localhost:8080"
    };
    
    return json(sampleData);
};

