import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import 'dotenv/config';

// Type definitions
interface Hero {
    name: string;
    roles: string[];
    attackRange: string;
    tier: string;
    winRate: number;
    abilities: string;
    strengths?: string[];
    weaknesses?: string[];
    teamUps?: TeamUp[];
}

interface TeamUp {
    teamUpName: string;
    primaryHero: string;
    secondaryHeroes: string[];
    effect: string;
    winRate: number;
}

// Load JSON data
import heroesDataJson from './shortheroes.json' assert { type: 'json' };
const heroesData: Hero[] = heroesDataJson as Hero[];
import teamupsJson from './teamups.json' assert { type: 'json' };
const teamups: TeamUp[] = teamupsJson as TeamUp[];

// Pre-process team-ups for faster lookup
const heroTeamUps = new Map<string, TeamUp[]>();
heroesData.forEach(hero => {
    hero.teamUps = teamups.filter(tu => 
        tu.primaryHero === hero.name || tu.secondaryHeroes.includes(hero.name)
    );
    heroTeamUps.set(hero.name, hero.teamUps);
});

function createHeroResponse(hero: Hero, userDescription: string) {
    const bestTeamUp = hero.teamUps?.[0] || null;

    return {
        userDescription,
        suggestion: {
            hero: hero.name,
            roles: hero.roles,
            attackRange: hero.attackRange,
            tier: hero.tier,
            winRate: hero.winRate,
            abilities: hero.abilities, // Now handles both formats
            strengths: Array.isArray(hero.strengths) ? hero.strengths : 
                     typeof hero.strengths === 'object' ? Object.values(hero.strengths).flat() : [],
            weaknesses: Array.isArray(hero.weaknesses) ? hero.weaknesses : 
                       typeof hero.weaknesses === 'object' ? Object.values(hero.weaknesses).flat() : [],
            teamup: bestTeamUp ? {
                teamUpName: bestTeamUp.teamUpName,
                effect: bestTeamUp.effect
            } : null
        },
        explanation: `Here are details about ${hero.name} which best matches your request.`,
        legalNotice: 'rivals-comps is not endorsed by Marvel or NetEase Games'
    };
}

async function getAIHeroSuggestion(userDescription: string) {
    const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
    const OLLAMA_MODEL = 'gemma2:latest';

    const prompt = `From this list of Marvel Rivals heroes, each with their roles and abilities:

    ${heroesData.map(h => 
    `${h.name} - Roles: ${h.roles.join(', ')}, Abilities: ${h.abilities}`
    ).join('\n')}

    Select the single hero that best matches this description: "${userDescription}".

    Respond with ONLY the hero's name, nothing else. Example: "Hulk"`;

    const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [{ role: 'user', content: prompt }],
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`AI API request failed with status ${response.status}`);
    }

    const jsonResponse = await response.json();
    const heroName = jsonResponse?.message?.content?.trim()
        .replace(/["\n\r]/g, '')
        .replace(/\.$/, '');

    const matchedHero = heroesData.find(h =>
        h.name.toLowerCase() === heroName.toLowerCase()
    );

    if (!matchedHero) {
        throw new Error(`AI returned unknown hero: "${heroName}"`);
    }

    return matchedHero;
}


export const POST: RequestHandler = async ({ request }) => {
    try {
        // Validate request content type
        if (request.headers.get('content-type') !== 'application/json') {
            return json({ error: 'Invalid content type' }, { status: 400 });
        }

        const requestData = await request.json().catch(() => null);
        
        if (!requestData?.userDescription || typeof requestData.userDescription !== 'string') {
            return json({ error: 'Invalid input - userDescription is required' }, { status: 400 });
        }

        const suggestedHero = await getAIHeroSuggestion(requestData.userDescription);
        const responseData = createHeroResponse(suggestedHero, requestData.userDescription);

        // Ensure the response is valid JSON
        return json(responseData, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Endpoint error:', error);
        
        // Ensure error response is valid JSON
        return json({ 
            error: 'Failed to get hero suggestion',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};