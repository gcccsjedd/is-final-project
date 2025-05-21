# AI Meal Planner API (Team 3nity)

This document outlines the API for the AI Meal Planner developed by Team 3nity.

## API Endpoint

- **Endpoint:** `/api/meal-planner`
- **HTTP Method:** `POST` (to be confirmed)

## Input Parameters

Details about the input parameters (e.g., dietary restrictions, calorie goals, number of meals, preferred cuisines, disliked ingredients).

- **Format:** JSON
- **Schema:** See `input.schema.json`

### Example Input:
```json
{
  "dietary_restrictions": ["vegetarian"],
  "calorie_goal_per_day": 2000,
  "number_of_days": 3,
  "preferred_cuisines": ["italian", "mexican"],
  "disliked_ingredients": ["mushrooms"]
}
```

## Output Format

Details about the output format (e.g., daily meal plans with recipes, nutritional information).

- **Format:** JSON

### Example Output:
```json
{
  "meal_plan": [
    {
      "day": 1,
      "breakfast": { "name": "Oatmeal with Berries", "calories": 400 },
      "lunch": { "name": "Quinoa Salad", "calories": 600 },
      "dinner": { "name": "Lentil Soup", "calories": 700 },
      "snacks": [{ "name": "Apple with Peanut Butter", "calories": 300 }]
    }
    // ... more days
  ]
}
```

## Error Handling

Details about possible error codes and messages.
- `400 Bad Request`: Invalid input parameters (e.g., missing required fields, invalid format).
- `500 Internal Server Error`: Unexpected error during meal plan generation.

## Troubleshooting Guide

- Ensure your input JSON matches the schema defined in `input.schema.json`.
- Check for any server-side logs if an internal error occurs.
