import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '../3nity-meal-planner/$types';

import Ajv from 'ajv';
import schema from './input.schema.json'; // Make sure ESM imports for JSON are configured in tsconfig or use a dynamic import

const ajv = new Ajv();
const validate = ajv.compile(schema);

export const POST: RequestHandler = async ({ request }) => {
    let requestData;
    try {
        requestData = await request.json();
    } catch (e) {
        throw error(400, 'Invalid JSON input');
    }

    if (!validate(requestData)) {
        // It's good practice to log validation errors on the server for debugging
        console.error('Input validation failed:', validate.errors);
        // Construct a more user-friendly error message
        const errorMessages = validate.errors?.map(err => `${err.instancePath || 'input'} ${err.message}`).join(', ');
        throw error(400, { message: `Invalid input parameters: ${errorMessages}` });
    }

    console.log('Received meal plan request:', requestData);

    // --- Ollama Integration --- 
    const mealPlanRequirements = {
        days: requestData.number_of_days,
        mealsPerDay: requestData.number_of_meals_per_day || 3,
        includeSnacks: requestData.include_snacks || false,
        restrictions: (requestData.dietary_restrictions as string[] | undefined)?.join(', ') || 'None',
        calorieGoal: requestData.calorie_goal_per_day ? `${requestData.calorie_goal_per_day} calories per day` : 'Not specified',
        cuisinePreferences: (requestData.preferred_cuisines as string[] | undefined)?.join(', ') || 'Any',
        dislikedIngredients: (requestData.disliked_ingredients as string[] | undefined)?.join(', ') || 'None',
        proteinGoal: requestData.protein_goal_grams ? `${requestData.protein_goal_grams}g protein/day` : 'Not specified',
        fatGoal: requestData.fat_goal_grams ? `${requestData.fat_goal_grams}g fat/day` : 'Not specified',
        carbGoal: requestData.carb_goal_grams ? `${requestData.carb_goal_grams}g carbs/day` : 'Not specified',
    };

    const prompt = `
    Please generate a ${mealPlanRequirements.days}-day meal plan based on the following requirements:
    - Target Daily Calories: ${mealPlanRequirements.calorieGoal}
    - Dietary Restrictions: ${mealPlanRequirements.restrictions}
    - Preferred Cuisines: ${mealPlanRequirements.cuisinePreferences}
    - Disliked Ingredients: ${mealPlanRequirements.dislikedIngredients}
    - Number of main meals per day (breakfast, lunch, dinner): ${mealPlanRequirements.mealsPerDay}
    - Include snacks: ${mealPlanRequirements.includeSnacks}
    - Protein Goal: ${mealPlanRequirements.proteinGoal}
    - Fat Goal: ${mealPlanRequirements.fatGoal}
    - Carb Goal: ${mealPlanRequirements.carbGoal}

    Provide the output STRICTLY as a JSON object with a single root key "meal_plan".
    The "meal_plan" should be an array of daily meal objects.
    Each daily meal object must have a "day" number (integer) and properties for "breakfast", "lunch", and "dinner".
    Each meal (breakfast, lunch, dinner) should be an object with "name" (string) and "calories" (integer, estimated).
    If snacks are included, add a "snacks" array to the daily meal object, where each snack is an object with "name" (string) and "calories" (integer, estimated).

    Example for one day if snacks are included:
    {
        "day": 1,
        "breakfast": { "name": "Scrambled Eggs with Spinach", "calories": 350 },
        "lunch": { "name": "Grilled Chicken Salad", "calories": 500 },
        "dinner": { "name": "Baked Salmon with Roasted Vegetables", "calories": 600 },
        "snacks": [ { "name": "Greek Yogurt with Berries", "calories": 150 } ]
    }

    Example for one day if snacks are NOT included:
    {
        "day": 1,
        "breakfast": { "name": "Oatmeal with Fruit", "calories": 400 },
        "lunch": { "name": "Lentil Soup and Whole Wheat Bread", "calories": 550 },
        "dinner": { "name": "Tofu Stir-fry with Brown Rice", "calories": 650 }
    }

    Do not include any explanations or introductory text outside the main JSON object.
`;

    console.log('Sending prompt to Ollama:', prompt);

    let ollamaResponseJson;
    try {
        const ollamaApiUrl = 'http://localhost:11434/api/generate';
        const ollamaPayload = {
            model: 'qwen2:1.5b',
            prompt: prompt,
            stream: false,
            format: 'json' // Request JSON output (model must support it)
        };

        const response = await fetch(ollamaApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ollamaPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ollama API error:', response.status, errorText);
            throw error(502, { message: `Error from Ollama API: ${response.status} - ${errorText}` });
        }

        const ollamaFullResponse = await response.json();
        console.log('Raw Ollama response:', ollamaFullResponse);

        // Mistral with format: 'json' should directly return a string that is parsable JSON in ollamaFullResponse.response
        // Or, if the model and Ollama version are perfectly aligned, ollamaFullResponse.response might already be a JS object.
        // We need to be robust here.
        if (typeof ollamaFullResponse.response === 'string') {
            try {
                ollamaResponseJson = JSON.parse(ollamaFullResponse.response);
            } catch (parseError: any) {
                console.error('Failed to parse Ollama response string as JSON:', parseError);
                console.error('Ollama response string was:', ollamaFullResponse.response);
                throw error(503, { message: `Failed to parse meal plan JSON from Ollama: ${parseError.message}. Response was: ${ollamaFullResponse.response}` });
            }
        } else if (typeof ollamaFullResponse.response === 'object' && ollamaFullResponse.response !== null) {
             ollamaResponseJson = ollamaFullResponse.response; // Assuming it's already a parsed object
        } else if (ollamaFullResponse.meal_plan) { // Some models might return the JSON structure directly at the root
            ollamaResponseJson = ollamaFullResponse;
        } else {
            console.error('Unexpected Ollama response format:', ollamaFullResponse);
            throw error(503, { message: 'Unexpected response format from Ollama. Expected a JSON string or object in the response field, or a direct JSON object.' });
        }

    } catch (e: any) {
        console.error('Error during Ollama interaction or processing:', e);
        if (e.status) { // Re-throw SvelteKit errors
            throw e;
        }
        throw error(500, { message: `Failed to generate meal plan: ${e.message}` });
    }
    // --- End Ollama Integration ---

    return json(ollamaResponseJson);
};
