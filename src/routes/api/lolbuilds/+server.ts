import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import itemData from './item.json' assert { type: 'json' };
import championData from './champion.json' assert { type: 'json' };

// Load environment variables
import 'dotenv/config';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'deepseek-r1:7b';

interface OllamaResponse {
    message: {
        content: string;
    };
}

interface ItemData {
    name: string;
    description: string;
    plaintext: string;
    tags: string[];
    id: string;
    price: {
        base: number;
        total: number;
        sell: number;
    };
    purchasable: boolean;
}

interface DataDragonData {
    validChampions: string;
    validItems: string;
    validItemNames: Set<string>;
    validBoots: string[];
}

interface ChampionValue {
    id: number;
    name: string;
    tags: string[];
}

interface ChampionData {
    champions: Array<{
        value: ChampionValue;
    }>;
}

interface EnemyTeamInfo {
    champion: string;
    tags: string;
}

// Utility function for fetch with retry
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = 3,
    delay: number = 2000
): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            console.warn(`Attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Max retries reached');
}

async function loadDataDragonData(): Promise<DataDragonData> {
    // Extract champion names
    const validChampions = championData.champions.map(champ => champ.value.name).join(', ');
    
    // Extract item names
    const validItemNamesList = itemData
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

function getChampionTags(championName: string): string[] {
    const champion = championData.champions.find(
        champ => champ.value.name.toLowerCase() === championName.toLowerCase()
    );
    return champion ? champion.value.tags : [];
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
    if (isSupport && enemyTeamInfo.length > 1) return 'Boots of Swiftness'; // For roaming supports

    return 'Plated Steelcaps'; // Default fallback
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { playerChampion, enemyTeam, laneOpponent } = await request.json();

        // Validate input
        if (!playerChampion || !enemyTeam || enemyTeam.length !== 5 || !laneOpponent) {
            return json({ error: 'Invalid input: Provide a player champion, 5 enemy champions, and a lane opponent' }, { status: 400 });
        }

        // Load Data Dragon data
        const { validChampions, validItems, validItemNames, validBoots } = await loadDataDragonData();

        // Validate player champion, enemy team, and lane opponent against Data Dragon
        const champions = championData.champions.map(champ => champ.value.name.toLowerCase());
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
        if (!enemyTeam.map((champ: string) => champ.toLowerCase()).includes(laneOpponent.toLowerCase())) {
            return json({ error: `Lane opponent ${laneOpponent} must be part of the enemy team` }, { status: 400 });
        }

        // Extract champion tags
        const playerChampionTags = getChampionTags(playerChampion);
        const laneOpponentTags = getChampionTags(laneOpponent);
        const enemyTeamInfo = enemyTeam.map((champ: string) => {
            const tags = getChampionTags(champ).join(', ');
            return { champion: champ, tags };
        });

        const recommendedBoots = selectRecommendedBoots(playerChampionTags, enemyTeamInfo);

        // Prepare prompt for Ollama with Data Dragon context
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

        // Call Ollama API
        const response = await fetchWithRetry(
            OLLAMA_API_URL,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: prompt,
                    stream: false,
                    options: { temperature: 0.6, num_predict: 600 },
                }),
            },
            3,
            2000
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseData = await response.json();
        console.log('Full Ollama response:', JSON.stringify(responseData, null, 2));

        // Handle Ollama response structure
        let content = '';
        if (responseData.response) {
            content = responseData.response;
        } else if (responseData.message?.content) {
            content = responseData.message.content;
        } else {
            throw new Error('Unexpected Ollama response format - no content found');
        }

        content = content.trim();
        console.log('Ollama response content:', content);

        let buildResponse;
        try {
            // Extract JSON from triple backticks
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                buildResponse = JSON.parse(jsonMatch[1]);
            } else {
                // Try parsing content directly if no backticks
                buildResponse = JSON.parse(content);
            }

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
            if (!buildResponse.alternativeBuilds || !Array.isArray(buildResponse.alternativeBuilds) || buildResponse.alternativeBuilds.length < 1) {
                throw new Error('Invalid response format: alternativeBuilds must contain at least 1 build');
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

            // Fallback: Attempt to extract items from text if JSON parsing fails
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
                        },
                        tips: {
                            laning: 'Not available due to parsing error',
                            trading: 'Not available due to parsing error',
                            powerspikes: 'Not available due to parsing error',
                            defensive: 'Not available due to parsing error'
                        }
                    };
                } else {
                    throw new Error('Failed to extract exactly 6 items from response');
                }
            } else {
                const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
                throw new Error(`Failed to parse Ollama response: ${errorMessage}\nRaw response: ${content}`);
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
        console.error('Error processing request:', error);
        return json({ error: `Failed to process request: ${errorMessage}` }, { status: 500 });
    }
};