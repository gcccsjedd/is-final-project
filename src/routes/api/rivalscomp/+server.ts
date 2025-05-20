import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import axios from 'axios';
import herotierlist from './herotierlist.json' assert { type: 'json' };
import teamuptierlist from './teamuptierlist.json' assert { type: 'json' };

// Replace with your actual API key or load from environment
import 'dotenv/config';
const API_KEY = process.env.MARVEL_RIVALS_API_KEY || 'YOUR_API_KEY';

interface Hero {
    name: string;
    role: string;
    tags: string[];
}

interface HeroStats {
    winRate: number;
    pickRate: number;
    banRate: number;
}

interface TeamUp {
    teamUpName: string;
    primaryHero: string;
    secondaryHeroes: string[];
    effect: string;
    winRate: string;
}

interface EnemyTeam {
    name: string;
    role: string;
    tags: string[];
}

async function getAllHeroes(): Promise<Hero[]> {
    try {
        const response = await axios.get('https://marvelrivalsapi.com/api/v1/heroes', {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching all heroes:', error.response?.data || error.message);
        } else {
            console.error('Error fetching all heroes:', error instanceof Error ? error.message : String(error));
        }
        throw new Error('Failed to fetch heroes list');
    }
}

async function getHeroDetails(heroName: string): Promise<Hero> {
    try {
        const response = await axios.get(`https://marvelrivalsapi.com/api/v1/heroes/hero/${encodeURIComponent(heroName)}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching details for ${heroName}:`, error.response?.data || error.message);
        } else {
            console.error(`Error fetching details for ${heroName}:`, error instanceof Error ? error.message : String(error));
        }
        throw new Error(`Failed to fetch details for ${heroName}`);
    }
}

async function getHeroStats(heroName: string): Promise<HeroStats> {
    try {
        const response = await axios.get(`https://marvelrivalsapi.com/api/v1/heroes/hero/${encodeURIComponent(heroName)}/stats`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching stats for ${heroName}:`, error.response?.data || error.message);
        } else {
            console.error(`Error fetching stats for ${heroName}:`, error instanceof Error ? error.message : String(error));
        }
        throw new Error(`Failed to fetch stats for ${heroName}`);
    }
}

function getHeroTier(heroName: string): { tier: string; winRate: number } | null {
    const tiers: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D'];
    for (const tier of tiers) {
        const hero = herotierlist.heroTierList[tier].find((h: { name: string; winRate: number }) => h.name === heroName);
        if (hero) return { tier, winRate: hero.winRate };
    }
    return null;
}

function getTeamUpTier(teamUpName: string): { tier: string; winRate: string } | null {
    const tiers: Array<'S' | 'A' | 'B' | 'C'> = ['S', 'A', 'B', 'C'];
    for (const tier of tiers) {
        const teamUp = teamuptierlist[tier].find(t => t.teamUpName === teamUpName);
        if (teamUp) return { tier, winRate: teamUp.winRate };
    }
    return null;
}

function analyzeEnemyTeam(enemyTeam: EnemyTeam[]): { roleCount: Record<string, number>; tagCount: Record<string, number> } {
    const roleCount: Record<string, number> = { Vanguard: 0, Duelist: 0, Strategist: 0 };
    const tagCount: Record<string, number> = {};

    enemyTeam.forEach(hero => {
        roleCount[hero.role]++;
        if (Array.isArray(hero.tags)) {
            hero.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        }
    });

    return { roleCount, tagCount };
}

// ...existing code...
async function suggestTeamComposition(enemyTeam: EnemyTeam[]): Promise<{ team: string[]; teamUp: string; explanation: string }> {
    const allHeroes = await getAllHeroes();
    const { roleCount, tagCount } = analyzeEnemyTeam(enemyTeam);

    // Counter rules based on enemy composition
    const counters: Record<string, string[]> = {
        Vanguard: ['Duelist', 'Strategist'],
        Duelist: ['Vanguard', 'Strategist'],
        Strategist: ['Duelist', 'Vanguard'],
    };

    const tagCounters: Record<string, string[]> = {
        'Tank': ['Damage', 'CrowdControl'],
        'Damage': ['Tank', 'Heal'],
        'Heal': ['Damage', 'Disrupt'],
        'CrowdControl': ['Mobile', 'Tank'],
        'Mobile': ['CrowdControl', 'Tank'],
    };

    // Prioritize roles to counter enemy
    const neededRoles = [];
    if (roleCount.Vanguard > 1) neededRoles.push('Duelist');
    if (roleCount.Duelist > 1) neededRoles.push('Vanguard');
    if (roleCount.Strategist > 1) neededRoles.push('Duelist');
    while (neededRoles.length < 4) neededRoles.push(Object.keys(counters)[Math.floor(Math.random() * 3)]);

    // Gather all team-up heroes (S and A tier, sorted by winRate descending)
    const allTeamUps = [...teamuptierlist.S, ...teamuptierlist.A]
        .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

    // Try to build a team that maximizes high win rate team-ups
    let bestTeam: string[] = [];
    let bestTeamUp: string = 'None';
    let bestTeamUpWinRate = 0;

    for (const teamUp of allTeamUps) {
        // Try to include as many heroes from the team-up as possible
        const team: string[] = [];
        const usedRoles = { Vanguard: 0, Duelist: 0, Strategist: 0 };

        // Add primary hero if not already added and role limit not exceeded
        const primaryHero = allHeroes.find(h => h.name === teamUp.primaryHero);
        if (primaryHero && usedRoles[primaryHero.role as keyof typeof usedRoles] < 2) {
            team.push(primaryHero.name);
            usedRoles[primaryHero.role as keyof typeof usedRoles]++;
        }

        // Add secondary heroes
        for (const secName of teamUp.secondaryHeroes) {
            if (team.length >= 6) break;
            const secHero = allHeroes.find(h => h.name === secName);
            if (
                secHero &&
                !team.includes(secHero.name) &&
                usedRoles[secHero.role as keyof typeof usedRoles] < 2
            ) {
                team.push(secHero.name);
                usedRoles[secHero.role as keyof typeof usedRoles]++;
            }
        }

        // Fill remaining slots with best available heroes by win rate and tier, respecting role limits
        const roleDistribution = { Vanguard: 2, Duelist: 2, Strategist: 2 };
        for (const role of Object.keys(roleDistribution) as Array<keyof typeof roleDistribution>) {
            const needed = roleDistribution[role] - usedRoles[role];
            if (needed > 0) {
                const candidatesRaw = allHeroes.filter(h => h.role === role && !team.includes(h.name));
                const candidatesWithStats = await Promise.all(
                    candidatesRaw.map(async (h) => {
                        const stats = await getHeroStats(h.name);
                        const tier = getHeroTier(h.name)?.tier || 'D';
                        return { hero: h, stats, tier };
                    })
                );
                const sortedCandidates = candidatesWithStats.sort((a, b) => {
                    const winRateDiff = (b.stats.winRate || 0) - (a.stats.winRate || 0);
                    if (winRateDiff !== 0) return winRateDiff;
                    const tierOrder = ['S', 'A', 'B', 'C', 'D'];
                    return tierOrder.indexOf(b.tier) - tierOrder.indexOf(a.tier);
                });
                let idx = 0;
                let added = 0;
                while (added < needed && idx < sortedCandidates.length && team.length < 6) {
                    const hero = sortedCandidates[idx].hero;
                    team.push(hero.name);
                    usedRoles[role]++;
                    added++;
                    idx++;
                }
            }
        }

        // If we have a full team, and this team-up has a higher win rate, use it
        if (team.length === 6 && parseFloat(teamUp.winRate) > bestTeamUpWinRate) {
            bestTeam = team;
            bestTeamUp = teamUp.teamUpName;
            bestTeamUpWinRate = parseFloat(teamUp.winRate);
        }
    }

    // Fallback: if no team-up could be formed, use original logic
    if (bestTeam.length === 0) {
        // Select 6 heroes (2 Vanguards, 2 Duelists, 2 Strategists)
        const team: string[] = [];
        const roleDistribution = { Vanguard: 2, Duelist: 2, Strategist: 2 };

        for (const role of Object.keys(roleDistribution) as Array<keyof typeof roleDistribution>) {
            const targetCount = roleDistribution[role];
            let selected = 0;
            const candidatesRaw = allHeroes.filter(h => h.role === role && !team.includes(h.name));
            const candidatesWithStats = await Promise.all(
                candidatesRaw.map(async (h) => {
                    const stats = await getHeroStats(h.name);
                    const tier = getHeroTier(h.name)?.tier || 'D';
                    return { hero: h, stats, tier };
                })
            );
            const sortedCandidates = candidatesWithStats.sort((a, b) => {
                const winRateDiff = (b.stats.winRate || 0) - (a.stats.winRate || 0);
                if (winRateDiff !== 0) return winRateDiff;
                const tierOrder = ['S', 'A', 'B', 'C', 'D'];
                return tierOrder.indexOf(b.tier) - tierOrder.indexOf(a.tier);
            });
            let idx = 0;
            while (selected < targetCount && idx < sortedCandidates.length) {
                const hero = sortedCandidates[idx].hero;
                team.push(hero.name);
                selected++;
                idx++;
            }
        }

        // Select team-up based on compatibility and countering
        const teamUpOptions = teamuptierlist.S.concat(teamuptierlist.A).filter(tu =>
            team.includes(tu.primaryHero) || tu.secondaryHeroes.some(h => team.includes(h))
        ).sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
        const teamUp = teamUpOptions.length > 0 ? teamUpOptions[0].teamUpName : 'None';

        bestTeam = team;
        bestTeamUp = teamUp;
    }

    // Generate explanation
    let explanation = 'Suggested team composition to counter enemy team:\n';
    explanation += `- Enemy has ${roleCount.Vanguard} Vanguards, ${roleCount.Duelist} Duelists, ${roleCount.Strategist} Strategists.\n`;
    explanation += `- Prioritized ${neededRoles.join(', ')} to counter enemy roles.\n`;
    explanation += `- Team: ${bestTeam.join(', ')} with ${bestTeamUp} team-up.\n`;
    explanation += `- Counters: ${Object.entries(tagCount)
        .map(([tag, count]) => `${tag} x${count} countered with ${tagCounters[tag]?.join(' and ') || 'general strategy'}`)
        .join(', ')}.\n`;

    return { team: bestTeam, teamUp: bestTeamUp, explanation };
}
// ...existing code...

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Validate API key presence
        if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
            throw new Error('MARVEL_RIVALS_API_KEY is not set in environment variables');
        }

        const { enemyTeam } = await request.json();

        // Validate input
        if (!enemyTeam || !Array.isArray(enemyTeam) || enemyTeam.length !== 6) {
            return json({ error: 'Invalid input: Provide an enemy team with exactly 6 heroes' }, { status: 400 });
        }

        // Fetch enemy team details
        const enemyTeamDetails = await Promise.all(enemyTeam.map(async (name: string) => {
            const details = await getHeroDetails(name);
            return { name, role: details.role, tags: details.tags };
        }));

        const result = await suggestTeamComposition(enemyTeamDetails);

        return json({
            enemyTeam,
            ...result,
            legalNotice: 'rivals-comps is not endorsed by Marvel or NetEase Games and does not reflect their views or opinions.'
        }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return json({ error: `Failed to process request: ${errorMessage}` }, { status: 500 });
    }
};