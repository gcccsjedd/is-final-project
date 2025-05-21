# Documentation: Text Summarizer and Main Idea Extractor

## Team Members and Roles

-  ***Documentation Lead***: Deianne Jeinne L. Resurreccion
-  ***API Developer***: John Edward D. Cardo
- ***Git Workflow Manager***: Marcus Adrianne B. Mercado

## Overview

This API allows users to send a whole set of text and receive a summary plus the main idea of the text. It uses the Ollama API (Deepseek-r1:latest) to generate the summary and main idea, and returns this data in a structured JSON format.

Additionally, the API provides basic error handling that will notify the user in case of issues with the input or the request processing.

---

## API Endpoint

**POST** `/api/team-MADJJE-nlp`

**GET** `/api/team-MADJJE-nlp`

This is the main endpoint where text can be sent for summarization and analysis.

### Expected HTTP Method:
- **POST**
- **GET**
---

## Input Parameters (***POST*** and ***GET***)

### GET

No input parameters needed.

`GET: http://localhost:5173/api/team-MADJJE-nlp`

---
### POST

The input should be sent in the body of the **POST** request as JSON.

### POST Request Body Format (JSON):

```json
{
  "text": "Add here the text that you want to be analyzed."
}
```


### Required Fields
- text: A string containing the text that you want to be summarized and analyzed. The text should be a valid string to allow the API to work.




### Example (JSON):
```bash
{
  curl -X POST http://localhost:5173/api/team-MADJJE-nlp \
  -H "Content-Type: application/json" \
  -d '{"text": "Did you know that penguins can drink seawater? These flightless birds have a special gland called the supraorbital gland, located just above their eyes, which filters out the salt from the ocean water they swallow. The excess salt is then excreted through their beaks or by sneezing. This adaptation allows penguins to survive in some of the harshest marine environments on Earth, where freshwater is scarce but saltwater is plentiful."}'
}
```

## Output Format

The API outputs a JSON object containing the following data:

### GET Response (Success):
```json
{
    "status": "online",
    "version": "1.0.0",
    "availableModels": [
        {
            "name": "deepseek-r1:latest",
            "description": "DeepSeek R1 model for high-quality text summarization",
            "recommended": true
        },
        {
            "name": "llama3",
            "description": "Llama 3 model for general text summarization",
            "recommended": false
        },
        {
            "name": "mistral",
            "description": "Mistral model for efficient summarization",
            "recommended": false
        }
    ],
    "endpoints": {
        "post": {
            "description": "Summarizes text and extracts the main idea",
            "requestFormat": {
                "text": "string (required) - The text to summarize"
            },
            "responseFormat": {
                "summary": "string[] - Array of summary sentences",
                "mainIdea": "string - The main idea in one sentence",
                "originalLength": "number - Approximate sentence count of original text",
                "summaryLength": "number - Number of sentences in the summary",
                "model": "string - The model used for summarization"
            }
        }
    },
    "usage": {
        "examples": [
            "POST /api/summarize with JSON body: {\"text\": \"Your text to summarize\"}",
            "Maximum text length: 10,000 characters"
        ],
        "rateLimit": "60 requests per hour"
    }
}
```

### POST Response (Success):

```json
{
    "summary": [
        "Penguins can drink seawater thanks to their unique supraorbital gland, which filters salt from the water they consume. The excess salt is expelled through their beaks or sneezing. This adaptation enables them to survive in marine environments with plenty of saltwater but scarce freshwater."
    ],
    "mainIdea": "Penguins filter salt from seawater using a specialized gland to adapt to harsh marine conditions where freshwater is unavailable.",
    "originalLength": 4,
    "summaryLength": 1,
    "model": "deepseek:r1:latest"
}
```

### Response Fields:

| Field | Data Type | Description |
| :---         |     :---       | :---          |
| summary   | string[]     | an array of strings, representing a summary of the text    |
| mainIdea     | string       | a string that shows the main idea      |
| originalLength     | number       | orginal text's number of sentences      |
| summaryLength     | number       | summary texts's number      |
| model     | string       | AI model used to generate the summary      |

## Error Handling

If an error occurs, the API will return an error response.

### Example Error (Invalid Text):
```json
{
    "error":"Please provide a valid string"
}
```

### Example Error (Server Error):
```json
{
    "error": "Failed to process request",
    "message": "Detailed error response from the server or exception"
}
```

## Troubleshooting

### Invalid Text:
- Ensure that the text parameter is a valid string and not empty.
- Example of valid input: "AI is transforming industries."

### Ollama API Error:
- Check if ollama is running, if not then
```bash
    ollama serve
```
- Check if ollama ai model is on the list
```bash
    ollama list
```
- If the ai model is not on the list
```bash
    ollama run deepseek-r1:latest
```

### Different Localhost Number:
- make sure that the POST and GET API calls are using http://localhost:5173.

### Notes
- Ensure Ollama is running locally at http://localhost11434.
- Ensure you have the right deepseek model installed `deepseek-r1:latest`
- The text must not exceed the limitations set by the external service for summarization

