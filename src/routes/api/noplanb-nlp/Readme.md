# Documentation: Sentiment Analysis

Team Members:
API Developer: Roa, Franzine Benneth C.
Documentation Lead: Gano, Mary Rose 
Git workflow Manager: Gregorio, Marlyn M.


## Overview

This API allows users to submit a block of text and receive a sentiment analysis result in return. It uses the Ollama API (Deepseek-r1:1.5b) to evaluate the overall sentiment expressed in the text—whether it's positive, negative, or neutral—and returns the analysis in a structured JSON format.

---

## API Endpoint

**POST** `/api/team-noplanb-nlp`

This is the main endpoint for submitting text to be analyzed for sentiment.

### Expected HTTP Method:
- **POST**

---

## Input Parameters

The input should be sent in the body of the POST request as JSON.

### Request Body Format (JSON):

```json
{
  "text": "The text you want analyzed for sentiment."
}
```

### Required Fields
- text: A valid string containing the content to be analyzed. The text must not be empty. The text should be a valid string to allow the API to work.




### Example (JSON):
```bash
{
    curl -X POST http://localhost:5173/api/team-noplanb-nlp \
    -H "Content-Type: application/json" \
    -d '{"text": "I absolutely love this product! It exceeded all my expectations."}'
}
```

## Output Format

The API outputs a JSON object containing the following data:

### Response (Success):

```json
{
  "sentiment": "positive",
  "confidence": 0.95,
  "explanation": "The text expresses strong positive emotions such as love and satisfaction.",
  "model": "deepseek-r1"
}
```

### Response Fields:

| Field       | Data Type | Description                                                            |
| ----------- | --------- | ---------------------------------------------------------------------- |
| sentiment   | string    | The detected sentiment: `positive`, `negative`, or `neutral`.          |
| confidence  | number    | A value between 0 and 1 indicating the confidence level of the result. |
| explanation | string    | A brief explanation of why this sentiment was assigned.                |
| model       | string    | The AI model used for sentiment analysis.                              |


## Error Handling

If an error occurs, the API will return a JSON error message.

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



