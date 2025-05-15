import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import ollama from "ollama";
import { z } from "zod";
import { GooglePlacesAPI } from "@langchain/community/tools/google_places";
import { GoogleRoutesAPI } from "@langchain/community/tools/google_routes";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { GOOGLE_PLACES_API_KEY, GOOGLE_ROUTES_API_KEY, OPENAI_API_KEY } from "$env/static/private";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";

import { Ollama } from "@langchain/ollama";
// const llm = new Ollama({
//     model: 'llama3.2',
//     temperature: 0.2,
// })
 const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo-0125",
    apiKey: OPENAI_API_KEY,
  });
export const POST: RequestHandler = async ({ request }) => {


    const { prompt } = await request.json();
    const analysisSchema = z.object({
        request_type: z.enum(['places', 'directions']),
        prompt: z.string().describe("The prompt to send to the corresponding API"),
    })
    const response = await ollama.chat({
        model: 'llama3.2',
        messages: [
            {
                role:
                    'system',
                content: `You are to identify what type of Google Maps API request the user is making. You can only respond with JSON. You can only respond with the following JSON format: { "request_type": "places" | "directions", "prompt": "<prompt>" }`
            }
            ,
            {
                role: 'user',
                content: prompt
            }
        ]
    })

    const parsedResponse = analysisSchema.safeParse(JSON.parse(response.message.content));

    if (parsedResponse.success) {
        const { request_type, prompt } = parsedResponse.data;



        switch (request_type) {
            case 'places':
                const placesResponse = await getPlaces(prompt);
                return json({
                    response: placesResponse,
                }, {
                    status: 200,
                })
            case 'directions':
                const directionsResponse = await getDirections(prompt);
                return json({
                    response: directionsResponse,
                }, {
                    status: 200,
                })
                break;
            default:
                return json({
                    error: 'Invalid request type',
                }, {
                    status: 400,
                })

        }
    }

    return json({
        response: parsedResponse,
    }, {
        status: 200,
    })

}



async function getPlaces(prompt: string) {
    const tools = [new GooglePlacesAPI(
        {
            apiKey: GOOGLE_PLACES_API_KEY,
        }
    )]

    const executor = await initializeAgentExecutorWithOptions(tools, llm, {
        agentType: "zero-shot-react-description",
        verbose: true,
    });
    const res = await executor.invoke({
        input: prompt,
    })

    return res;

}

async function getDirections(prompt: string) {
    const tools = [new GoogleRoutesAPI({
        apiKey: GOOGLE_ROUTES_API_KEY,
    })];


    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "You are a helpful assistant"],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
    ]);

    const agent = await createToolCallingAgent({
        llm,
        tools,
        prompt: promptTemplate,
    });

    const agentExecutor = new AgentExecutor({
        agent,
        tools,
    });

    const result = await agentExecutor.invoke({
        input: prompt,
    });


    return result;
}

