# Team-Lastnerve NLP API

A Svelte-based application that provides natural language processing capabilities through an API endpoint powered by the Mistral-7B-Instruct model via OpenRouter API.

## API Documentation

### 1. API Endpoint & HTTP Method

- **URL**: `http://localhost:5173/api/team-lastnerve-nlp`
- **Method**: POST

### 2. Input Parameters (JSON)

```json
{
  "message": "Your text to process goes here. This can be any natural language input that you want to process with the AI model."
}
```

### 3. Output Format (JSON)

Successful response:
```json
{
  "success": true,
  "response": "The AI-generated response to your input message will appear here."
}
```

Error response:
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

### 4. Example Request/Response

**Request:**
```json
{
  "message": "Summarize the key events of World War II in three sentences."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "response": "World War II began in 1939 when Nazi Germany invaded Poland, triggering declarations of war from Britain and France. The conflict expanded globally with the United States joining after Japan's attack on Pearl Harbor in 1941, and the formation of the Allied powers against the Axis powers of Germany, Italy, and Japan. The war ended in 1945 with Germany's surrender in May following Hitler's suicide and Japan's surrender in August after the United States dropped atomic bombs on Hiroshima and Nagasaki."
}
```

### 5. Error Handling & Troubleshooting Guide

#### Common Error Cases

**400 Bad Request - Invalid Message Format**
```json
{
  "success": false,
  "error": "Invalid message format"
}
```
Troubleshooting: Ensure your request body contains a "message" field with a string value.

**400 Bad Request - Empty Message**
```json
{
  "success": false,
  "error": "Invalid message format"
}
```
Troubleshooting: The "message" field cannot be empty or null.

**500 Internal Server Error - API Error**
```json
{
  "success": false,
  "error": "API returned status code 429: Too Many Requests"
}
```
Troubleshooting: The OpenRouter API may have rate limits or be temporarily unavailable. Try again later.

**500 Internal Server Error - Unexpected Response Format**
```json
{
  "success": false,
  "error": "Unexpected response format from API"
}
```
Troubleshooting: The API response structure from OpenRouter may have changed. Contact the developer.

**405 Method Not Allowed**
```
Method Not Allowed
```
Troubleshooting: Only POST requests are allowed. Make sure you're not using GET, PUT, or other HTTP methods.
 
## Notes

- The API uses the Mistral-7B-Instruct model through OpenRouter
- Response times may vary based on model complexity and input length
- Make sure to replace the API key if deploying to production

## Team Members

Vanryc Eizer T. Mayor
- Develops the backend code and handles the integration of the OpenRouterAI and Mistral APIs.

Jade Vinas
- Assists with managing the API endpoints

John Rel Talmento
- Writes and maintains the project documentation, including technical guides and usage instructions.