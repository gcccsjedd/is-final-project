# Team Alpha Sentiment Analysis API

## Overview

The Team SoftDevs Sentiment Analysis API is a Natural Language Processing (NLP) agent that analyzes the sentiment of input text, classifying it as Positive, Negative, or Neutral. Built with SvelteKit and powered by Groq's language model (`gemma2-9b-it`), the API provides a sentiment label, a confidence score (0-1), and a brief explanation of the analysis. It is designed for applications like customer feedback analysis, social media monitoring, or market research.

## Team Information

- **Members**: 3
- **Roles**:
  - **Chris Jen Roa - API Developer**: Implements the API logic and integrates with Groq.
  - **Neil Carlo Nabot - Documentation Lead**: Authors this README and ensures clear documentation.
  - **Dominic Molino - Git Workflow Manager**: Manages branching, commits, and pull requests.

## API Endpoint

- **URL**: `/api/team-alpha-sentiment`
- **Method**: `POST`
- **Description**: Analyzes the sentiment of a single text input, returning a structured JSON response with sentiment, score, and analysis.

## Input Parameters

- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
  	"text": "string"
  }
  ```
  - `text`: The text to analyze (required, non-empty string).

### JSON Schema for Input Validation

```json
{
	"$schema": "http://json-schema.org/draft-07/schema#",
	"type": "object",
	"properties": {
		"text": {
			"type": "string",
			"minLength": 1
		}
	},
	"required": ["text"],
	"additionalProperties": false
}
```

## Output Format

- **Content-Type**: `application/json`
- **Response**:
  ```json
  {
    "sentiment": "string", // "Positive", "Negative", or "Neutral"
    "score": number, // 0 to 1 (0 = extremely negative, 1 = extremely positive)
    "analysis": "string" // Brief explanation of the sentiment
  }
  ```

## Example Request/Response

### Request

```bash
curl -X POST http://localhost:5173/api/softdev-sentiment-analysis \
  -H "Content-Type: application/json" \
  -d '{"text": "This coffee shop is amazing! Best latte I’ve ever had."}'
```

### Response

```json
{
	"sentiment": "Positive",
	"score": 0.85,
	"analysis": "The text expresses enthusiasm with words like 'amazing' and 'best latte'."
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages for failure cases:

- **400 Bad Request**:
  - **Cause**: Missing or empty `text` field.
  - **Response**:
    ```json
    { "error": "Text is required" }
    ```
  - **Troubleshooting**: Ensure the request body includes a non-empty `text` field.
- **500 Internal Server Error**:
  - **Cause**: Groq API failure (e.g., invalid API key, model unavailable) or server issues.
  - **Response**:
    ```json
    { "error": "Error message from Groq or server" }
    ```
  - **Troubleshooting**:
    - Verify the `GROQ_API_KEY` in the `.env` file is valid.

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository>
   ```
2. **Install Dependencies**:
   ```bash
   bun install
   ```
3. **Set Up Environment Variables**:
   - Create a `.env` file in the project root:
     ```env
     GROQ_API_KEY=your_groq_api_key
     ```
   - Obtain a Groq API key from Groq(https://groq.com/).
4. **Run the Development Server**:
   ```bash
   bun dev
   ```
   - Access the API at `http://localhost:5173/api/softdev-sentiment-analysis`.
5. **Test the API**:
   - Use `curl`, Postman, or the Svelte frontend to send POST requests.

## Folder Structure

```
src/routes/api/team-alpha-sentiment/
├── +server.ts         # API implementation
├── util.ts            # Sentiment analysis logic
├── schema.json        # JSON schema for input validation
└── README.md          # This documentation
```

## Notes

- The API uses the `gemma2-9b-it` model, which is optimized for NLP tasks but may not handle highly nuanced or multilingual texts as well as specialized sentiment analysis tools.
- The keyword-based fallback in `util.ts` ensures robustness but may oversimplify mixed sentiments; refine weighting for better accuracy.

## Troubleshooting

- **API Returns Neutral for Negative Text**: Check if keywords like "killed" or "tragic" are correctly detected in `util.ts`. Update the `negativeKeywords` list if needed.
- **Slow Response Times**: Ensure the Groq API key has sufficient quota. Consider caching results for repeated texts.
- **Invalid JSON Response**: Verify the Groq model’s output format. Adjust the prompt to enforce strict JSON if deviations occur.
