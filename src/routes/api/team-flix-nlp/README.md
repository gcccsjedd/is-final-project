flix-nlp

This API analyzes a given text and returns its detected language, overall sentiment, and a concise summary.

API Endpoint

POST http://localhost:5173/api/team-flix-nlp

Input Parameters

Content-Type: application/json

JSON Body:

{ "text": "<string> — the text to analyze" }

Required:

text (string): The input text to be analyzed.

Output Format

Returns a JSON object with the following fields:

{ "summary": "<string>" // Direct, concise summary of the input text }

Example Request

POST /api/team-flix-nlp Content-Type: application/json

{ "text": "Albert Einstein was a theoretical physicist known for developing the theory of relativity." }

Example Response

{ "summary": "Albert Einstein was a theoretical physicist known for developing the theory of relativity." }

Error Handling

The API may return the following errors:


Status Code	Response	Description
400	{ "error": "Missing text" }	Request did not include the text field or it was empty.
500	{ "error": "Failed to process request" }	Server encountered an unexpected error processing the request.
Troubleshooting

Empty or missing text: Make sure the JSON body includes the text field and that it is not an empty string.

Unexpected response or errors: Check server logs for more details.

Language detection accuracy