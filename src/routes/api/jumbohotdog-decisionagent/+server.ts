import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import OpenAI from "openai";
import type { Project, TechStackAdvice } from "../../../types";
import { validateProject } from "$lib/validate";


//api key
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
	throw new Error("Environment variable VITE_OPENAI_API_KEY is not set.");
}

// openai client
const openai = new OpenAI({
	apiKey
});

// POST
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: Project = await request.json();
		
		// Validate the request body
		const validation = validateProject(body);
		if (!validation.valid) {
			return json(
				{ 
					error: "Validation failed", 
					details: validation.errors 
				}, 
				{ status: 400 }
			);
		}

		const { name, type, teamSize, requirements } = body;
		const prompt = `As a tech stack advisor, recommend appropriate technologies for the following project:
		Project Name: ${name}
		Project Type: ${type}
		Team Size: ${teamSize}
		Requirements: ${requirements.join(', ')}

		Please recommend a complete tech stack including:
		1. Frontend (framework, language, CSS framework)
		2. Backend (language, framework, database)
		3. DevOps (hosting, CI/CD, monitoring)
		4. Tools (version control, project management, communication)

		Format the response as a JSON object matching this structure:
		{
			"frontend": {
				"framework": "string",
				"language": "string",
				"cssFramework": "string",
				"justification": "string"
			},
			"backend": {
				"language": "string",
				"framework": "string",
				"database": "string",
				"justification": "string"
			},
			"devOps": {
				"hosting": "string",
				"CI_CD": "string",
				"monitoring": "string",
				"justification": "string"
			},
			"tools": {
				"versionControl": "string",
				"projectManagement": "string",
				"communication": "string",
				"justification": "string"
			}
		}

		Consider the project requirements, team size, and type when making recommendations.`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini", //do not change this model -aron
			messages: [
				{
					role: "system",
					content: "You are a tech stack advisor that provides detailed, well-justified technology recommendations for software projects."
				},
				{
					role: "user",
					content: prompt
				}
			],
			response_format: { type: "json_object" }
		});

		const content = completion.choices[0].message.content;
		if (!content) {
			throw new Error("No content received from OpenAI");
		}
		const recommendedStack = JSON.parse(content);

		const response: TechStackAdvice = {
			project: body,
			recommendedStack
		};

		return json(response);
	} catch (error) {
		console.error("POST handler error:", error);
		return json({ error: "Failed to process request" }, { status: 500 });
	}
};
