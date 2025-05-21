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
        [key: string]: string | string[];
    };
    strengths?: string[];
    weaknesses?: string[];
    teamUps?: TeamUps[];
}


interface TeamUps {
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
import teamupsJson from './teamups.json' assert { type: 'json' };
const teamups = teamupsJson as TeamUps[];

heroesData.forEach(hero => {
    hero.teamUps = teamups.filter(tu =>
        tu.primaryHero === hero.name || tu.secondaryHeroes.includes(hero.name)
    );
});


// const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// const GROQ_API_KEY = process.env.GROQ_API_KEY;
// const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const OLLAMA_API_URL = 'http://localhost:11434/api/chat'; // or /api/generate
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2:latest'; // Fallback to a reliable model


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
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return fetchWithRetry(url, options, retries - 1, retryDelay); // Exponential backoff
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
        attackRange: string;
        tier: string;
        winRate: number;
        abilities: Record<string, any>;
        strengths: string[];
        weaknesses: string[];
        teamup: string;
        tips: string[];
        reason: string;
    };
    explanation: string;
}> {
    const allHeroes = getAllHeroes();
    const teamUpData: string = Object.entries(teamups)
            .flatMap(([tier, tu]: [string, TeamUps]) =>
                [ `Team-Up: ${tu.teamUpName}
        Primary Hero: ${tu.primaryHero}
        Secondary Heroes: ${tu.secondaryHeroes.join(', ')}
        Effect: ${tu.effect}
        Win Rate: ${tu.winRate}
        `
                ]
            )
            .join('\n---\n');
        const heroDescriptions = allHeroes
            .map((hero) => {
                return `Name: ${hero.name}

    Roles: ${hero.roles.join(', ')}
    Attack Range: ${hero.attackRange}
    Tier: ${hero.tier}
    Win Rate: ${hero.winRate}
    Strengths: ${
                    Array.isArray(hero.strengths)
                        ? hero.strengths.join('; ')
                        : typeof hero.strengths === 'object' && hero.strengths !== null
                        ? Object.entries(hero.strengths)
                            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
                            .join('; ')
                        : 'None'
                }
    Weaknesses: ${
                    Array.isArray(hero.weaknesses)
                        ? hero.weaknesses.join('; ')
                        : typeof hero.weaknesses === 'object' && hero.weaknesses !== null
                        ? Object.entries(hero.weaknesses)
                            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
                            .join('; ')
                        : 'None'
                }
    Abilities: ${Object.entries(hero.abilities || {})
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ')}
    Team-Up: ${hero.teamUps}
    `;
            })
            .join('\n---\n');

        const prompt = `
    You are a recommendation engine.

    Based on the user's preferences below, select and recommend the most suitable hero from the provided list. Only pick a hero from the list. Return only a valid JSON object, and nothing else — no text before or after.

    User Description:
    "${userDescription}"

    Hero Data:
    ${heroDescriptions}

    Team-Up Synergies:
    ${teamUpData}

    Your output must be a single JSON object in this **exact** format, where all data is embedded directly in the 'suggestion' field. Do not place the suggestion data in the 'explanation' field. Populate all fields, and provide at least two tips for the player.

    {
    "userDescription": "${userDescription}",
    "suggestion": {
        "hero": "",
        "roles": [],
        "attackRange": "",
        "tier": "",
        "winRate": 0,
        "abilities": {
        },
        "strengths": [],
        "weaknesses": [],
        "teamup":{
            "teamUpName": "",
            "effect": "",
        },
        "tips": [],
        "reason": ""
    },
    "legalNotice": "rivals-comps is not endorsed by Marvel or NetEase Games and does not reflect their views or opinions."
    }
    `;



    try {
        const response = await fetchWithRetry(
            OLLAMA_API_URL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3
                }),
            }
        );

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('API returned an empty response');
        }

        console.log('Raw content from the API:', content);

        // TODO: Parse the content string to extract structured suggestion data.
        // This is a placeholder return with dummy values.
        try {
            const parsed = JSON.parse(content);

            if (!parsed?.suggestion) {
                throw new Error('Parsed content does not contain a suggestion field.');
            }

            const heroName = parsed.suggestion.hero.toLowerCase();

            const matchingTeamups = teamups.filter(
                (tu) =>
                    tu.primaryHero.toLowerCase() === heroName ||
                    tu.secondaryHeroes.map(h => h.toLowerCase()).includes(heroName)
            );
            const firstMatch = matchingTeamups[0] || null;

            if (firstMatch) {
                parsed.suggestion.teamup = {
                    teamUpName: firstMatch.teamUpName,
                    effect: firstMatch.effect,
                };
            } else {
                parsed.suggestion.teamup = {
                    teamUpName: '',
                    effect: '',
                };
            }   

            return parsed;
        } catch (parseError) {
            console.warn('Failed to parse structured suggestion, returning explanation only.');
            return {
                suggestion: {
                    hero: 'Unknown',
                    roles: [],
                    attackRange: '',
                    tier: '',
                    winRate: 0,
                    abilities: {},
                    strengths: [],
                    weaknesses: [],
                    teamup: '',
                    tips: [],
                    reason: 'Failed to parse suggestion from AI response.'
                },
                explanation: content
            };
        }

    } catch (error) {
        console.error('AI generation failed:', error);
        throw error;
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
        return json(
            {
                userDescription,
                ...result,
                legalNotice:
                    'rivals-comps is not endorsed by Marvel or NetEase Games and does not reflect their views or opinions.'
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return json({ error: `Failed to process request: ${errorMessage}` }, { status: 500 });
    }
};