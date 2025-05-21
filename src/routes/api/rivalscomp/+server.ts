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
    abilities?: Record<string, string | string[]>;
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
import heroesDataJson from './heroes.json' assert { type: 'json' };
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
            abilities: hero.abilities || {},
            strengths: Array.isArray(hero.strengths) ? hero.strengths : 
                     typeof hero.strengths === 'object' ? Object.values(hero.strengths).flat() : [],
            weaknesses: Array.isArray(hero.weaknesses) ? hero.weaknesses : 
                       typeof hero.weaknesses === 'object' ? Object.values(hero.weaknesses).flat() : [],
            teamup: bestTeamUp ? {
                teamUpName: bestTeamUp.teamUpName,
                effect: bestTeamUp.effect
            } : null,
            tips: [
                `Focus on ${hero.roles.join('/')} playstyle`,
                `Master the ${Object.keys(hero.abilities || {}).join(', ')} abilities`
            ]
        },
        explanation: `Here are details about ${hero.name} which best matches your request.`,
        legalNotice: 'rivals-comps is not endorsed by Marvel or NetEase Games'
    };
}

async function getAIHeroSuggestion(userDescription: string) {
    const OLLAMA_API_URL = 'http://localhost:11434/api/chat';
    const OLLAMA_MODEL = 'gemma2:latest';

    const prompt = `From this list of Marvel Rivals heroes: 
    ${heroesData.map(h => h.name).join(', ')}

    Select the single hero that best matches this description: "${userDescription}"
    
    Respond with ONLY the hero's name, nothing else. Example: "Hulk"`;

    const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            options: { temperature: 0.3 }
        })
    });
    
    if (!response.ok) {
        throw new Error(`AI API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.message?.content;
    
    if (!content) {
        throw new Error('Empty response from AI');
    }
    
    // Clean up the response to extract just the hero name
    const heroName = content.trim()
        .replace(/"/g, '')
        .replace(/\.$/, '')
        .split('\n')[0];
    
    // Find matching hero (case insensitive)
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
        const { userDescription } = await request.json();
        
        if (!userDescription || typeof userDescription !== 'string') {
            return json({ error: 'Invalid input' }, { status: 400 });
        }

        // Get AI suggestion (will throw if fails)
        const suggestedHero = await getAIHeroSuggestion(userDescription);
        return json(createHeroResponse(suggestedHero, userDescription));

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Endpoint error:', errorMessage);
        return json({ 
            error: 'Failed to get hero suggestion',
            details: errorMessage 
        }, { status: 500 });
    }
};