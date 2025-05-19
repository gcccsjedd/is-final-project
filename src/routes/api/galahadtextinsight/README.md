Team NLP TextInsight API
The TextInsight API is a sophisticated NLP service that processes text input to generate a summary, analyze sentiment, extract key phrases, categorize the summary, and identify named entities. Built using the Svelte, Bun, and Ollama tech stack, it leverages the LLaMA 3.1 model hosted via Ollama to deliver multi-layered text analysis, simulating aspects of a General AI approach.
API Endpoint

URL: /api/team-nlp-insight
Method: POST

Input Parameters
The API expects a JSON payload with the following structure:



Field
Type
Description
Required
Constraints



text
String
The text to process
Yes
50–5000 characters


maxSummaryLength
Integer
Maximum length of summary in words
No
50–500 (default: 150)


maxKeyPhrases
Integer
Maximum number of key phrases to extract
No
1–10 (default: 5)


Example Input:
{
  "text": "Apple's new iPhone 16, released in September 2025, offers groundbreaking battery life and a sleek design. Tim Cook announced the launch in Cupertino, but some users reported software glitches. Overall, it's a solid upgrade.",
  "maxSummaryLength": 50,
  "maxKeyPhrases": 3
}

Output Format
The API returns a JSON response with the following structure:



Field
Type
Description



success
Boolean
Indicates if the request was successful


summary
String
The summarized text


sentiment
String
Sentiment of the summary (Positive, Negative, Neutral)


keyPhrases
Array
List of key phrases extracted from the summary


category
String
Category of the summary (Product Review, News Article, Opinion Piece, Other)


entities
Object
Named entities (people, organizations, locations)


inputLength
Integer
Length of input text in characters


summaryLength
Integer
Number of words in the summary


Example Output:
{
  "success": true,
  "summary": "Apple's iPhone 16 offers great battery life and design but has software issues.",
  "sentiment": "Positive",
  "keyPhrases": ["great battery life", "sleek design", "software glitches"],
  "category": "Product Review",
  "entities": {
    "people": ["Tim Cook"],
    "organizations": ["Apple"],
    "locations": ["Cupertino"]
  },
  "inputLength": 234,
  "summaryLength": 14
}

Error Handling
The API returns errors in the following format:



Status Code
Description
Example Error Response



400
Invalid input or processing error
{"message": "Failed to process request", "details": "Invalid input: text is too short"}


Common Error Cases

Missing text field: Returns 400 with message indicating missing required field.
Text too short/long: Returns 400 if text is <50 or >5000 characters.
Invalid maxSummaryLength: Returns 400 if value is <50 or >500.
Invalid maxKeyPhrases: Returns 400 if value is <1 or >10.
Ollama service unavailable: Returns 400 with a generic error message.
Invalid entity JSON: Returns empty entity arrays if parsing fails.

Troubleshooting Guide

API returns 400 with "Invalid input":

Verify JSON payload matches the schema (e.g., text is a string, maxSummaryLength and maxKeyPhrases are integers).
Ensure text is between 50 and 5000 characters.
Check maxSummaryLength (50–500) and maxKeyPhrases (1–10) if provided.


API returns 400 with "Failed to process request":

Ensure Ollama is running with the llama3.1 model (ollama run llama3.1).
Check network connectivity to the Ollama server.


Empty entities or unexpected category:

Verify the summary contains clear entities or category cues.
Test with different inputs to ensure model consistency.


No response or timeout:

Verify Bun runtime is configured correctly.
Check server logs for unhandled exceptions.



Setup Instructions

Install Bun:

Verify Bun is installed: bun --version.
Install dependencies: bun install.


Set up Ollama:

Ensure Ollama is running with the llama3.1 model: ollama run llama3.1.
Confirm the model is pulled and accessible.


Run the SvelteKit server:

Start the development server: bun run dev.


Test the API:

Use a tool like Postman or curl to send requests to http://localhost:5173/api/team-nlp-insight.



Example curl Command:
curl -X POST http://localhost:5173/api/team-nlp-insight \
  -H "Content-Type: application/json" \
  -d '{"text": "Apple released the iPhone 16...", "maxSummaryLength": 50, "maxKeyPhrases": 3}'

Schema
The input validation schema is defined in schema.json within this directory. It ensures the JSON payload adheres to the expected structure and constraints, as specified in the project requirements.
Notes

The API is implemented in +server.js in this directory.
Ensure all dependencies (e.g., jsonschema, ollama) are installed via bun install.
For development, test edge cases (e.g., very short/long texts, ambiguous summaries) to ensure robustness.
