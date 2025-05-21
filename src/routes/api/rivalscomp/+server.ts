import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import 'dotenv/config';

// Type definitions
interface Heroes {
    name: string;
    roles: string[];
    attackRange: string;
    tier: string;
    winRate: number;
    abilities?: {
        [key: string]: string | string[]; // account for string or string[] like in "passive"
    };
    strengths?: string[];
    weaknesses?: string[];
    teamUps?: TeamUp[]; // Only include if you define and use this
}

interface TeamUpTierList {
    S: TeamUp[];
    A: TeamUp[];
    B: TeamUp[];
    C: TeamUp[];
}

interface TeamUp {
    teamUpName: string;
    primaryHero: string;
    secondaryHeroes: string[];
    effect: string;
    teamupTier: string;
    winRate: number;
}

// Load JSON data with type assertions
import heroesDataJson from './heroes.json' assert { type: 'json' };
const heroesData = heroesDataJson as Heroes[];
import teamuptierlistJson from './teamuptierlist.json' assert { type: 'json' };     
const teamuptierlist = teamuptierlistJson as TeamUpTierList;
    
const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'llama2:latest';


// Utility function for fetch with retry
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
): Promise<Response> {
  const controller = new AbortController();
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // wait 1 second before retry
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

function getHeroDetails(heroName: string): Heroes | undefined {
    return heroesData.find((hero) => hero.name === heroName);
}

function getAllHeroes(): Heroes[] {
    return heroesData;
}

async function suggestMainHeroes(userDescription: string): Promise<{ 
    suggestion: { 
        hero: string; 
        roles: string[];
        tier: string;
        winRate: number; 
        abilities: Record<string, any>;
        strengths: string[]; 
        weaknesses: string[]; 
        playstyle: string[]; 
        teamup: string; 
        tips: string[] 
    }; 
    explanation: string 
}> {
    const allHeroes = getAllHeroes();

    const prompt = `
        You are an expert in Marvel Rivals hero selection. Given a user's description, suggest exactly 1 hero that suits them best as their main hero. If the user explicitly names a hero (e.g., "I want to main Namor"), prioritize that hero if they exist in the available heroes list. Otherwise, suggest a hero based on their description. For the suggested hero, provide:

        Their role (Vanguard, Duelist, or Strategist)
        Current tier and win rate
        All abilities (only from provided data)
        All key strengths
        All key weaknesses
        Complete playstyle description
        One good team composition
        2-3 tips for playing this hero effectively
        User description: "${userDescription}"

        Available Heroes:"${allHeroes}"

        Response format (JSON):
        {
        "suggestion": {
        "hero": "Hero Name",
        "roles": ["Vanguard", "Frontliner", "Tank"],
        "tier": "S/A/B/C/D/E/F",
        "winRate": number,
        "abilities": {"ability1": "description1", "ability2": "description2", ...},
        "strengths": ["strength1", "strength2", ...],
        "weaknesses": ["weakness1", "weakness2", ...],
        "playstyle": ["playstyle1", "playstyle2", ...],
        "teamup": "single best partner",
        "tips": ["tip1", "tip2", "tip3"]
        },
        "explanation": "Explanation connecting user's preferences to the suggested hero"
        }
    `;

    try {
        const ollamaResponse = await fetchWithRetry(
            OLLAMA_API_URL,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                    options: { temperature: 0.6, num_predict: 600 },
                }),
            },
        );

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama API failed with status: ${ollamaResponse.status}`);
        }

        const responseData = await ollamaResponse.json();
        const content = responseData.message?.content;

        if (!content) {
            throw new Error("Ollama returned an empty response");
        }

        // Extract JSON from response (handles both raw JSON and markdown code blocks)
        let jsonText: string;
        let jsonResponse: any;
        try {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i);
            jsonText = jsonMatch ? jsonMatch[1].trim() : content.trim();

            // Normalize potential single quotes or unquoted keys if needed (optional safety)
            jsonResponse = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Raw content from Ollama:', content);
            throw new Error(`Failed to parse Ollama response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`);
        }

        // Validate required fields
        if (!jsonResponse.suggestion || !jsonResponse.explanation) {
            throw new Error("Ollama response missing required fields");
        }

        return jsonResponse;

    } catch (error) {
        console.error("AI generation failed:", error);
        // Mock response for testing
        return {
            suggestion: {
                hero: "Namor",
                roles: ["Vanguard", "Diver", "Tank"],
                tier: "A",
                winRate: 50.0,
                abilities: { normalAttack: "Trident Strike" },
                strengths: ["High mobility", "Strong melee"],
                weaknesses: ["Low range", "Squishy without abilities"],
                playstyle: ["Aggressive", "Dive-oriented"],
                teamup: "Hulk",
                tips: ["Use mobility to flank", "Coordinate with tanks"]
            },
            explanation: "Namor suits your preference for a mobile, aggressive hero."
        };
        // throw new Error("AI generation failed: " + (error instanceof Error ? error.message : String(error)));
        
    }
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { userDescription } = await request.json();

        // Validate input
        if (!userDescription || typeof userDescription !== 'string') {
            return json({ error: 'Invalid input: Provide a description of your playstyle as a string' }, { status: 400 });
        }

        const result = await suggestMainHeroes(userDescription);

        console.log('Response:', result);
        return json({
            userDescription,
            ...result,
            legalNotice: 'rivals-comps is not endorsed by Marvel or NetEase Games and does not reflect their views or opinions.'
        }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return json({ error: `Failed to process request: ${errorMessage}` }, { status: 500 });
    }
};