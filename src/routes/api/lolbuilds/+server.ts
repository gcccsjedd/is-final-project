import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import fetch from 'node-fetch';
import itemData from './item.json' assert { type: 'json' };
import championData from './champion.json' assert { type: 'json' };

// Load environment variables
import 'dotenv/config';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

interface GroqResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface ItemData {
    name: string;
    gold: {
        total: number;
    };
    tags: string[];
}

interface DataDragonData {
    validChampions: string;
    validItems: string;
    validItemNames: Set<string>;
    validBoots: string[];
}

interface ChampionData {
    data: {
        [key: string]: {
            tags: string[];
            version: string;
            id: string;
            key: string;
            name: string;
            title: string;
            blurb: string;
            info: {
                attack: number;
                defense: number;
                magic: number;
                difficulty: number;
            };
            image: {
                full: string;
                sprite: string;
                h: number;
            };
            partype: string;
            stats: Record<string, number>;
        };
    };
}

interface EnemyTeamInfo {
    champion: string;
    tags: string;
}

async function loadDataDragonData(): Promise<DataDragonData> {
    const validChampions = Object.keys(championData.data).join(', ');
    const validItemNamesList = Object.values(itemData.data)
        .filter((item: ItemData) => item.name && item.name.trim() !== '')
        .map((item: ItemData) => item.name);
    const validItems = validItemNamesList.join(', ');
    const validItemNames = new Set(validItemNamesList.map(name => name.toLowerCase().replace(/['"]/g, '')));
    const validBoots = validItemNamesList.filter(item => item.toLowerCase().includes('boots'));
    return { validChampions, validItems, validItemNames, validBoots };
}

function normalizeItemName(name: string): string {
    return name.toLowerCase().replace(/['"]/g, '').trim();
}

function selectRecommendedBoots(playerTags: string[], enemyTeamInfo: EnemyTeamInfo[]): string {
    const isMage = playerTags.includes('Mage');
    const isMarksman = playerTags.includes('Marksman');
    const isSupport = playerTags.includes('Support');
    const isTank = playerTags.includes('Tank');
    const isFighter = playerTags.includes('Fighter') || playerTags.includes('Bruiser');
    const hasHeavyAP = enemyTeamInfo.filter(info => info.tags.includes('Mage') || info.tags.includes('Support')).length >= 3;
    const hasHeavyCC = enemyTeamInfo.some(info => info.tags.includes('Support') || info.champion.toLowerCase() === 'ahri');
    const hasSlows = enemyTeamInfo.some(info => info.tags.includes('Support') || info.champion.toLowerCase() === 'lulu');

    if (isMage) return 'Sorcerer\'s Shoes';
    if (isMarksman) return 'Berserker\'s Greaves';
    if (isSupport && !isMage) return 'Ionian Boots of Lucidity';
    if (isFighter || isTank || playerTags.includes('Bruiser')) return 'Plated Steelcaps';

    // Situational boots
    if (hasHeavyAP || hasHeavyCC) return 'Mercury\'s Treads';
    if (isSupport && enemyTeamInfo.length > 1) return 'Symbiotic Soles'; // Rare case for roaming supports

    return 'Plated Steelcaps'; // Default fallback
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Validate API key presence
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in environment variables');
        }

        const { playerChampion, enemyTeam, laneOpponent } = await request.json();

        // Validate input
        if (!playerChampion || !enemyTeam || enemyTeam.length !== 5 || !laneOpponent) {
            return json({ error: 'Invalid input: Provide a player champion, 5 enemy champions, and a lane opponent' }, { status: 400 });
        }

        // Load Data Dragon data
        const { validChampions, validItems, validItemNames, validBoots } = await loadDataDragonData();

        // Validate player champion, enemy team, and lane opponent against Data Dragon
        const champions = validChampions.split(', ').map(champ => champ.toLowerCase());
        if (!champions.includes(playerChampion.toLowerCase())) {
            return json({ error: `Invalid player champion: ${playerChampion}` }, { status: 400 });
        }
        const invalidEnemyChampions = enemyTeam.filter((champ: string) => !champions.includes(champ.toLowerCase()));
        if (invalidEnemyChampions.length > 0) {
            return json({ error: `Invalid enemy champions: ${invalidEnemyChampions.join(', ')}` }, { status: 400 });
        }
        if (!champions.includes(laneOpponent.toLowerCase())) {
            return json({ error: `Invalid lane opponent: ${laneOpponent}` }, { status: 400 });
        }
        // Validate that laneOpponent is part of the enemyTeam
        if (!enemyTeam.map((champ: string) => champ.toLowerCase()).includes(laneOpponent.toLowerCase())) {
            return json({ error: `Lane opponent ${laneOpponent} must be part of the enemy team` }, { status: 400 });
        }

        // Extract champion tags for the player champion
        const playerChampionTags = (championData as ChampionData).data[playerChampion]?.tags || [];
        const laneOpponentTags = (championData as ChampionData).data[laneOpponent]?.tags || [];
        const enemyTeamInfo = enemyTeam.map((champ: string) => {
            const tags = (championData as ChampionData).data[champ]?.tags?.join(', ') || '';
            return { champion: champ, tags };
        });

        const recommendedBoots = selectRecommendedBoots(playerChampionTags, enemyTeamInfo);

        // Prepare prompt for Groq with Data Dragon context, champion tags, and lane opponent
        const prompt = `You are a League of Legends build expert. Valid champions are: ${validChampions}. Valid items are: ${validItems}. Valid boots are: ${validBoots}. For the player champion "${playerChampion}" with tags "${playerChampionTags}" facing a lane opponent "${laneOpponent}" with tags "${laneOpponentTags}" and an enemy team of ${enemyTeamInfo.map((info: EnemyTeamInfo) => `${info.champion} (${info.tags})`).join(', ')}, provide a detailed build recommendation. Prioritize countering the lane opponent while also considering the overall enemy team composition. The Boots of Swiftness should not be recommended for the player champion unless it's a Jhin, but the Boots of Swiftness could be placed in the situational builds. Return ONLY a valid JSON object with the following structure: 
        {
            "recommendedBuild": ["Item1", "Item2", "Item3", "Item4", "Item5", "Item6"],
            "explanation": {
                "Item1": "Reason for Item1",
                "Item2": "Reason for Item2",
                "Item3": "Reason for Item3",
                "Item4": "Reason for Item4",
                "Item5": "Reason for Item5",
                "Item6": "Reason for Item6"
            },
            "alternativeBuilds": [
                {"situation": "Situation 1", "build": ["AltItem1", "AltItem2", "AltItem3", "AltItem4", "AltItem5", "AltItem6"]},
                {"situation": "Situation 2", "build": ["AltItem7", "AltItem8", "AltItem9", "AltItem10", "AltItem11", "AltItem12"]}
            ],
            "buildProcess": {
                "earlyGame": "Steps for early game (items and strategy)",
                "midGame": "Steps for mid game (items and strategy)",
                "lateGame": "Steps for late game (items and strategy)"
            },
            "tips": {
                "laning": "Specific tips for laning against the opponent",
                "trading": "How to trade effectively in lane",
                "powerspikes": "When to look for all-ins or aggressive plays",
                "defensive": "How to play defensively when needed"
            }
        }
        The "recommendedBuild" must contain exactly 6 items from the valid items list, including one completed boots item. Ensure that they're all completed items that cost more than 2000 gold, except for a completed boots item which costs lower than 2000 gold. Do not recommend Doran's items. The "alternativeBuilds" must also contain valid items. Use the champion tags to inform item choices (e.g., Fighters may need Health and Attack Damage, Mages need Ability Power). Prioritize items that counter the lane opponent's tags (e.g., Armor against Fighters, Magic Resist against Mages).Ensure that marksman do not build AP items, except for Kaisa and Kog'Maw. Do not include any text outside the JSON object.`;

        // Call Groq API
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json() as GroqResponse;
        let buildResponse;
        try {
            const content = data.choices[0].message.content.trim();
            console.log('Raw Groq response:', content); // Log raw response for debugging

            try {
                buildResponse = JSON.parse(content);
                // Validate recommendedBuild
                if (!buildResponse.recommendedBuild || !Array.isArray(buildResponse.recommendedBuild) || buildResponse.recommendedBuild.length !== 6) {
                    throw new Error('Invalid build response format: recommendedBuild must contain exactly 6 items');
                }
                // Validate items against Data Dragon
                const normalizedRecommendedBuild = buildResponse.recommendedBuild.map(normalizeItemName);
                const invalidItems = normalizedRecommendedBuild.filter((item: string) => !validItemNames.has(item));
                if (invalidItems.length > 0) {
                    throw new Error(`Invalid items in recommendedBuild: ${invalidItems.join(', ')}`);
                }
                // Validate explanation
                if (!buildResponse.explanation || typeof buildResponse.explanation !== 'object') {
                    throw new Error('Invalid response format: explanation must be an object');
                }
                for (const item of buildResponse.recommendedBuild) {
                    if (!buildResponse.explanation[item]) {
                        throw new Error(`Missing explanation for item: ${item}`);
                    }
                }
                // Validate alternativeBuilds
                if (!buildResponse.alternativeBuilds || !Array.isArray(buildResponse.alternativeBuilds) || buildResponse.alternativeBuilds.length !== 2) {
                    throw new Error('Invalid response format: alternativeBuilds must contain exactly 2 builds');
                }
                for (const altBuild of buildResponse.alternativeBuilds) {
                    if (!altBuild.situation || !altBuild.build || !Array.isArray(altBuild.build) || altBuild.build.length !== 6) {
                        throw new Error('Invalid alternative build format');
                    }
                    const normalizedAltBuild = altBuild.build.map(normalizeItemName);
                    const invalidAltItems = normalizedAltBuild.filter((item: string) => !validItemNames.has(item));
                    if (invalidAltItems.length > 0) {
                        throw new Error(`Invalid items in alternative build: ${invalidAltItems.join(', ')}`);
                    }
                }
                // Validate buildProcess
                if (!buildResponse.buildProcess || !buildResponse.buildProcess.earlyGame || !buildResponse.buildProcess.midGame || !buildResponse.buildProcess.lateGame) {
                    throw new Error('Invalid response format: buildProcess must include earlyGame, midGame, and lateGame');
                }
            } catch (parseError: unknown) {
                console.error('JSON Parse Error:', parseError);
                console.error('Failed to parse content:', content);

                // Try to extract JSON from the content if it's wrapped in markdown or other text
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        buildResponse = JSON.parse(jsonMatch[0]);
                        console.log('Successfully parsed JSON from extracted content');
                    } catch (extractError: unknown) {
                        console.error('Failed to parse extracted JSON:', extractError);
                        const errorMessage = extractError instanceof Error ? extractError.message : 'Unknown parsing error';
                        throw new Error(`Failed to parse Groq response: ${errorMessage}\nRaw response: ${content}`);
                    }
                } else {
                    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
                    throw new Error(`Failed to parse Groq response: ${errorMessage}\nRaw response: ${content}`);
                }
            }
        } catch (parseError) {
            // Fallback: Attempt to extract items from text if JSON parsing fails
            const content = data.choices[0].message.content.trim();
            console.log('Raw Groq response:', content); // Log for debugging
            const itemsMatch = content.match(/"recommendedBuild":\s*\[([^\]]*)\]/);
            if (itemsMatch) {
                const items = itemsMatch[1].split(',').map(item => item.trim().replace(/['"\[\]]/g, ''));
                if (items.length === 6) {
                    const normalizedItems = items.map(normalizeItemName);
                    const invalidItems = normalizedItems.filter((item: string) => !validItemNames.has(item));
                    if (invalidItems.length > 0) {
                        throw new Error(`Invalid items in fallback recommendedBuild: ${invalidItems.join(', ')}`);
                    }
                    buildResponse = {
                        recommendedBuild: items,
                        explanation: items.reduce((acc: Record<string, string>, item: string) => {
                            acc[item] = 'Explanation not available due to parsing error';
                            return acc;
                        }, {}),
                        alternativeBuilds: [
                            { situation: 'Not available', build: items.slice(0, 6) },
                            { situation: 'Not available', build: items.slice(0, 6) }
                        ],
                        buildProcess: {
                            earlyGame: 'Not available due to parsing error',
                            midGame: 'Not available due to parsing error',
                            lateGame: 'Not available due to parsing error'
                        }
                    };
                } else {
                    throw new Error('Failed to extract exactly 6 items from response');
                }
            } else {
                const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
                throw new Error(`Failed to parse Groq response: ${errorMessage}\nRaw response: ${content}`);
            }
        }

        return json({
            champion: playerChampion,
            laneOpponent: laneOpponent,
            ...buildResponse,
            legalNotice: 'lolbuilds is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.'
        }, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return json({ error: `Failed to process request: ${errorMessage}` }, { status: 500 });
    }
};