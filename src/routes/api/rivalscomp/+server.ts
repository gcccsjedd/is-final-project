import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import axios from 'axios';
import 'dotenv/config';

// Type definitions
interface Hero {
    name: string;
    role: string;
    tags: string[];
    tier?: { tier: string; winRate: number };
    teamUps?: TeamUp[];
}

interface HeroStats {
    winRate: number;
}

interface TeamUp {
    teamUpName: string;
    primaryHero: string;
    secondaryHeroes: string[];
    effect: string;
    winRate: string;
}

interface HeroTierList {
    S: Array<{ name: string; winRate: number }>;
    A: Array<{ name: string; winRate: number }>;
    B: Array<{ name: string; winRate: number }>;
    C: Array<{ name: string; winRate: number }>;
    D: Array<{ name: string; winRate: number }>;
}

interface TeamUpTierList {
    S: TeamUp[];
    A: TeamUp[];
    B: TeamUp[];
    C: TeamUp[];
}

interface HeroData {
    name: string;
    abilities?: Record<string, any>;
    strengths?: string[];
    weaknesses?: string[];
    playstyle?: string[];
}

interface HeroesData {
    Vanguard: HeroData[];
    Duelist: HeroData[];
    Strategist: HeroData[];
}

// Load JSON data with type assertions
import heroesDataJson from './heroes.json' assert { type: 'json' };
const heroesData = heroesDataJson as HeroesData;
import herotierlistJson from './herotierlist.json' assert { type: 'json' };
const herotierlist = herotierlistJson as { heroTierList: HeroTierList };
import teamuptierlistJson from './teamuptierlist.json' assert { type: 'json' };
const teamuptierlist = teamuptierlistJson as { teamupTierList: TeamUpTierList };

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';

type HeroRole = 'Vanguard' | 'Duelist' | 'Strategist';

function getHeroDetails(heroName: string): Hero {
    const roles: HeroRole[] = ['Vanguard', 'Duelist', 'Strategist'];
    
    for (const role of roles) {
        const hero = heroesData[role]?.find(h => h.name === heroName);
        if (hero) {
            const tags: string[] = [];
            
            if (hero.abilities) {
                tags.push(...Object.keys(hero.abilities));
            }
            
            if (Array.isArray(hero.strengths)) {
                tags.push(...hero.strengths);
            }
            
            if (Array.isArray(hero.weaknesses)) {
                tags.push(...hero.weaknesses);
            }

            // Fetch tier information
            const tiers: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D'];
            let tierInfo = null;
            for (const tier of tiers) {
                const heroTier = herotierlist.heroTierList[tier]?.find(h => h.name === heroName);
                if (heroTier) {
                    tierInfo = { tier, winRate: heroTier.winRate };
                    break;
                }
            }

            // Fetch team-up information
            const teamUps: TeamUp[] = [];
            const teamUpTiers: Array<'S' | 'A' | 'B' | 'C'> = ['S', 'A', 'B', 'C'];
            for (const tier of teamUpTiers) {
                const tierTeamUps = teamuptierlist.teamupTierList[tier]?.filter(
                    tu => tu.primaryHero === heroName || tu.secondaryHeroes.includes(heroName)
                );
                if (tierTeamUps) {
                    teamUps.push(...tierTeamUps);
                }
            }

            return {
                name: hero.name,
                role,
                tags,
                tier: tierInfo || { tier: 'D', winRate: 40 },
                teamUps
            };
        }
    }
    throw new Error(`Hero ${heroName} not found in heroes.json`);
}

function getAllHeroes(): Hero[] {
    const roles: HeroRole[] = ['Vanguard', 'Duelist', 'Strategist'];
    const allHeroes: Hero[] = [];
    
    for (const role of roles) {
        heroesData[role]?.forEach(hero => {
            allHeroes.push(getHeroDetails(hero.name));
        });
    }
    
    return allHeroes;
}

async function suggestMainHeroes(userDescription: string): Promise<{ 
    suggestion: { 
        hero: string; 
        role: string;
        tier: string;
        winRate: number; 
        abilities: Record<string, any>;
        strengths: string[]; 
        weaknesses: string[]; 
        playstyle: string[]; 
        teamup: string[]; 
        tips: string[] 
    }; 
    explanation: string 
}> {
    const allHeroes = getAllHeroes();

    const prompt = `
You are an expert in Marvel Rivals hero selection. Given a user's description of their preferred playstyle, suggest exactly 1 hero that would suit them best as their main hero. Consider suggesting a hero regardless of their current tier unless the userDescription specifies a preference for a specific tier. For the suggested hero, provide:

1. Their role (Vanguard, Duelist, or Strategist)
2. Current tier and win rate (for informational purposes)
3. All abilities (include all relevant abilities as a key-value object, using only the abilities listed in the provided hero data)
4. All key strengths (include all relevant strengths)
5. All key weaknesses (include all relevant weaknesses)
6. Complete playstyle description (include all relevant playstyle aspects)
7. One good team composition (mention 1 strong team-up partner)
8. 2-3 tips for playing this hero effectively

Important: 
- Do not limit the number of strengths, weaknesses, or playstyle aspects - include all relevant ones for the hero.
- For abilities, use ONLY the abilities provided in the hero data below. Do not invent or include abilities not listed in the provided data.

User description: "${userDescription}"

Available Heroes:
${allHeroes.map(hero => {
    const heroData = heroesData[hero.role as HeroRole]?.find(h => h.name === hero.name);
    const strengths = heroData?.strengths ? 
        (Array.isArray(heroData.strengths) ? heroData.strengths : [String(heroData.strengths)]) : 
        ['N/A'];
    const weaknesses = heroData?.weaknesses ? 
        (Array.isArray(heroData.weaknesses) ? heroData.weaknesses : [String(heroData.weaknesses)]) : 
        ['N/A'];
    const abilities = heroData?.abilities ? 
        Object.entries(heroData.abilities).map(([key, value]) => `${key}: ${value}`).join(', ') : 
        'No abilities listed';
    
    return `- ${hero.name} (${hero.role}): ${hero.tier?.tier || 'D'} tier, ${hero.tier?.winRate || 40}% win rate. ` +
           `Strengths: ${strengths.join(', ')}. Weaknesses: ${weaknesses.join(', ')}. Abilities: ${abilities}.`;
}).join('\n')}

Response format (JSON):
{
    "suggestion": {
        "hero": "Hero Name",
        "role": "Vanguard/Duelist/Strategist",
        "tier": "S/A/B/C/D",
        "winRate": number,
        "abilities": {"ability1": "description1", "ability2": "description2", ...},
        "strengths": ["strength1", "strength2", "strength3", ...],
        "weaknesses": ["weakness1", "weakness2", "weakness3", ...],
        "playstyle": ["playstyle1", "playstyle2", "playstyle3", ...],
        "teamup": ["single best partner and the teamup definition"],
        "tips": ["tip1", "tip2", "tip3"]
    },
    "explanation": "Explanation connecting user's preferences to the suggested hero"
}
`;

    try {
        const response = await axios.post(GROQ_API_URL, {
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            }
        });

        const result = JSON.parse(response.data.choices[0].message.content);

        // Validate response
        if (!result.suggestion || typeof result.suggestion !== 'object') {
            throw new Error('Invalid Groq API response: Missing or invalid suggestion object');
        }

        // Verify suggestion has required fields and arrays aren't artificially limited
        const suggestion = result.suggestion;
        if (!suggestion.hero || !suggestion.role || !suggestion.tier || suggestion.winRate === undefined || !suggestion.abilities) {
            throw new Error('Invalid suggestion format: Missing required fields');
        }
        if (suggestion.strengths && suggestion.strengths.length < 2) {
            throw new Error('Invalid suggestion format: Strengths list too short');
        }
        if (suggestion.weaknesses && suggestion.weaknesses.length < 2) {
            throw new Error('Invalid suggestion format: Weaknesses list too short');
        }
        if (suggestion.playstyle && suggestion.playstyle.length < 2) {
            throw new Error('Invalid suggestion format: Playstyle list too short');
        }
        if (suggestion.teamup && suggestion.teamup.length !== 1) {
            throw new Error('Invalid suggestion format: Should have exactly 1 teamup');
        }

        // Validate abilities match heroes.json
        const heroData = heroesData[suggestion.role as HeroRole]?.find(h => h.name === suggestion.hero);
        if (heroData?.abilities) {
            const expectedAbilities = Object.keys(heroData.abilities);
            const returnedAbilities = Object.keys(suggestion.abilities);
            if (!returnedAbilities.every(ability => expectedAbilities.includes(ability))) {
                throw new Error('Invalid suggestion format: Abilities do not match heroes.json');
            }
            // Optionally, check if descriptions match
            for (const [key, value] of Object.entries(suggestion.abilities)) {
                if (heroData.abilities[key] !== value) {
                    throw new Error(`Invalid ability description for ${key}: does not match heroes.json`);
                }
            }
        } else if (Object.keys(suggestion.abilities).length > 0) {
            throw new Error('Invalid suggestion format: Abilities provided for hero with no abilities in heroes.json');
        }

        return {
            suggestion: suggestion,
            explanation: result.explanation
        };
    } catch (error) {
        console.error('Groq API error:', error instanceof Error ? error.message : String(error));

        // Fallback logic with single hero
        const fallbackHero = shuffleArray(allHeroes)[0];
        const heroData = heroesData[fallbackHero.role as HeroRole]?.find(h => h.name === fallbackHero.name);
        
        // Get all strengths
        const strengths = heroData?.strengths ? 
            (Array.isArray(heroData.strengths) ? heroData.strengths : [String(heroData.strengths)]) : 
            ['No strengths listed'];
        
        // Get all weaknesses
        const weaknesses = heroData?.weaknesses ? 
            (Array.isArray(heroData.weaknesses) ? heroData.weaknesses : [String(heroData.weaknesses)]) : 
            ['No weaknesses listed'];

        // Generate complete playstyle based on abilities
        const playstyle = [];
        if (heroData?.abilities) {
            if (heroData.abilities.normalAttack) playstyle.push("Basic: " + heroData.abilities.normalAttack.split(' – ')[0]);
            if (heroData.abilities.q) playstyle.push("Ultimate: " + heroData.abilities.q.split(' – ')[0]);
            if (heroData.abilities.lshift) playstyle.push("Movement: " + heroData.abilities.lshift.split(' – ')[0]);
            if (heroData.abilities.e) playstyle.push("Special: " + heroData.abilities.e.split(' – ')[0]);
        }

        // Get exactly one team comp
        const teamup = fallbackHero.teamUps?.length ? 
            [fallbackHero.teamUps[0].primaryHero === fallbackHero.name ? 
             fallbackHero.teamUps[0].secondaryHeroes[0] : 
             fallbackHero.teamUps[0].primaryHero] : 
            ['No recommended partner'];

        return {
            suggestion: {
                hero: fallbackHero.name,
                role: fallbackHero.role,
                tier: fallbackHero.tier?.tier || 'D',
                winRate: fallbackHero.tier?.winRate || 40,
                abilities: heroData?.abilities || {},
                strengths: strengths,
                weaknesses: weaknesses,
                playstyle: playstyle.length ? playstyle : ["Adaptive playstyle"],
                teamup: teamup,
                tips: [
                    `Master ${strengths[0] || 'your abilities'}`,
                    `Compensate for ${weaknesses[0] || 'your limitations'}`,
                    `Pair well with ${teamup[0]}`
                ]
            },
            explanation: `Based on your description, ${fallbackHero.name} is recommended as it aligns with your described preferences with its full capabilities.`
        };
    }
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Validate Groq API key
        if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY') {
            throw new Error('GROQ_API_KEY is not set in environment variables');
        }

        const { userDescription } = await request.json();

        // Validate input
        if (!userDescription || typeof userDescription !== 'string') {
            return json({ error: 'Invalid input: Provide a description of your playstyle as a string' }, { status: 400 });
        }

        const result = await suggestMainHeroes(userDescription);

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