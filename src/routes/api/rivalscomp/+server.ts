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
  retryDelay = 1000 // milliseconds
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2); // Exponential backoff
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
    const teamUpData: string = Object.entries(teamuptierlist)
        .flatMap(([tier, teamups]: [string, TeamUp[]]) => 
            teamups.map((tu: TeamUp) => `Team-Up: ${tu.teamUpName}
    Tier: ${tier}
    Primary Hero: ${tu.primaryHero}
    Secondary Heroes: ${tu.secondaryHeroes.join(', ')}
    Effect: ${tu.effect}
    Win Rate: ${tu.winRate}
    `)).join('\n---\n');
    const heroDescriptions = allHeroes.map(hero => {
        return `Name: ${hero.name}
                Roles: ${hero.roles.join(', ')}
                Tier: ${hero.tier}
                Win Rate: ${hero.winRate}
                Attack Range: ${hero.attackRange}
                Strengths: ${
                Array.isArray(hero.strengths)
                    ? hero.strengths.join('; ')
                    : typeof hero.strengths === 'object' && hero.strengths !== null
                    ? Object.entries(hero.strengths).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ')
                    : 'None'
                }
                Weaknesses: ${
                Array.isArray(hero.weaknesses)
                    ? hero.weaknesses.join('; ')
                    : typeof hero.weaknesses === 'object' && hero.weaknesses !== null
                    ? Object.entries(hero.weaknesses).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ')
                    : 'None'
                }
                Abilities: ${Object.entries(hero.abilities || {}).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join(' | ')}
                Team-Up: ${hero.teamUps}
                `;
                }).join('\n---\n');

                const prompt = `
                Based on the user's playstyle or preferences below, recommend the most suitable hero from the following list.
                Only pick from these heroes, and provide details such as the hero name, reason for selection, and a summary of their abilities and strengths.

                User Description: "${userDescription}"

                Hero Data:
                ${heroDescriptions}

                A team up is when a primary hero and at least one secondary hero work is present in a team. They will acquire a bonus effect when they are in the same team.
                Team-Up Synergies:
                ${teamUpData}
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

        console.log('Raw content from Ollama:', content);

        // Placeholder: parse content and return a valid suggestion object
        // You should replace this with actual parsing logic as needed
        return {
            suggestion: {
                hero: "Unknown",
                roles: [],
                tier: "",
                winRate: 0,
                abilities: {},
                strengths: [],
                weaknesses: [],
                playstyle: [],
                teamup: "",
                tips: []
            },
            explanation: content
        };
    } catch (error) {
        console.error("AI generation failed:", error);
        throw error; // Rethrow so the caller can handle it
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