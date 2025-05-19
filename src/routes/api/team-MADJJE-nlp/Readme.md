# Documentation: Text Summarizer and Main Idea Extractor

## Overview

This API allows users to send a whole set of text and receive a summary plus the main idea of the text. It uses the Ollama API (Deepseek-r1:latest) to generate the summary and main idea, and returns this data in a structured JSON format.

Additionally, the API provides basic error handling that will notify the user in case of issues with the input or the request processing.

---

## API Endpoint

**POST** `/api/team-MADJJE-nlp`

This is the main endpoint where text can be sent for summarization and analysis.

### Expected HTTP Method:
- **POST**

---

## Input Parameters

The input should be sent in the body of the POST request as JSON.

### Request Body Format (JSON):

```json
{
  "text": "The full text you want summarized and analyzed."
}
```

### Required Fields
- text: A string containing the text that you want to be summarized and analyzed. The text should be a valid string to allow the API to work.




### Example (JSON):
```bash
{
  curl -X POST http://localhost:5173/api/team-MADJJE-nlp \
  -H "Content-Type: application/json" \
  -d '{"text": "Artificial intelligence (AI) is intelligence demonstrated by machines, unlike the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of \"intelligent agents\": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals."}'
}
```

## Output Format

The API outputs a JSON object containing the following data:

### Response (Success):

```json
{"summary":["Artificial intelligence (AI) refers to the intelligence demonstrated by machines, distinct from the natural intelligence found in humans and animals. Textbooks define AI as the study of \"intelligent agents,\" which are devices capable of perceiving their environment and taking actions to achieve specific goals."],

"mainIdea":"The main idea is that AI focuses on creating intelligent systems (agents) that perceive and interact with their environment to accomplish defined objectives.",

"originalLength":2,

"summaryLength":1,

"model":"deepseek-r1"}
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
    ollama run [ai-model-name]
```

### Different Localhost Number:
- make sure that the POST API call is using http://localhost:5173.

### Notes
- Ensure Ollama is running locally at http://localhost11434.
- The text must not exceed the limitations set by the external service for summarization

