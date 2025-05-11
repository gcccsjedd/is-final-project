// src/routes/api/404notfound-nlp/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const sampleData = {
        message: "This is a 404notfound-nlp API response",
        timestamp: new Date().toISOString(),
        endpoints: [
            {
                path: "/api/404notfound-nlp",
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

