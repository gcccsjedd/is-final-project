# Documentation: Sentiment Analysis

Team Members:
API Developer: Roa, Franzine Benneth C.
Documentation Lead: Gano, Mary Rose 
Git workflow Manager: Gregorio, Marlyn M.


## Overview

This API allows users to submit a block of text and receive a sentiment analysis result in return. It uses the Ollama API (Deepseek-r1:1.5b) to evaluate the overall sentiment expressed in the text—whether it's positive, negative, or neutral—and returns the analysis in a structured JSON format.

---

## API Endpoint

**POST** `/api/noplanb-nlp`

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
    curl -X POST http://localhost:5173/api/noplanb-nlp \
    -H "Content-Type: application/json" \
    -d '{"text": "Attending the workshop last weekend was one of the best decisions I’ve made this year. The speakers were inspiring, the content was well-organized, and the atmosphere was incredibly welcoming. I came away with actionable insights and a renewed sense of motivation. Hats off to the organizers!"}'
}
```

## Output Format

The API outputs a JSON object containing the following data:

### Response (Success):

```json
{
  "original": "Attending the workshop last weekend was one of the best decisions I’ve made this year. The speakers were inspiring, the content was well-organized, and the atmosphere was incredibly welcoming. I came away with actionable insights and a renewed sense of motivation. Hats off to the organizers!",
  "analysis": {
    "score": 5,
    "sentiment": "very positive",
    "explanation": "The sentiment of the text is clearly very positive. The speaker describes the workshop as one of the best decisions they've made, which expresses strong satisfaction. They praise the speakers, highlight how well-organized the content was, and emphasize the welcoming atmosphere. The mention of actionable insights and renewed motivation further reinforces the overall positive tone."
  },
  "model": "deepseek-r1:1.5b",
  "raw_response": "<think>Alright, so the user has given me a query where they want me to analyze the sentiment of a text and return a JSON with specific fields: score, sentiment, and explanation.\n\nFirst, I need to understand what each field means. The score ranges from -5 to 5, indicating how positive or negative the sentiment is. \"Very negative\" would be strong negatives, while \"Very positive\" is strong positives. Neutral is in between.\n\nLooking at the text: \"Attending the workshop last weekend was one of the best decisions I’ve made this year. The speakers were inspiring, the content was well-organized, and the atmosphere was incredibly welcoming. I came away with actionable insights and a renewed sense of motivation. Hats off to the organizers!\"\n\nThe sentiment is clearly positive here. The speaker mentions being a \"best decision\" they've made, which adds positivity. They praise the speakers for their inspiration and well-organized content, which also boosts the score. The welcoming atmosphere and the outcomes they received are all positives too.\n\nI don’t see any negative words or strong negatives mentioned. So, I think the sentiment should be positive. \n\nFor the explanation part, I need to describe why it’s positive. It includes things like being a best decision, praise from others, welcoming atmosphere, and actionable insights. These all contribute to a positive overall feeling.\n\nPutting it all together, I’ll write a JSON object reflecting these points.\n\n```json\n{\n  \"score\": 5,\n  \"sentiment\": \"very positive\",\n  \"explanation\": \"The sentiment of the text is clearly very positive. The speaker describes the workshop as one of the best decisions they've made, which expresses strong satisfaction. They praise the speakers, highlight how well-organized the content was, and emphasize the welcoming atmosphere. The mention of actionable insights and renewed motivation further reinforces the overall positive tone.\"\n}\n```"
}

```

### Response Fields:

| Field           | Type   | Description                                                                          |
| --------------- | ------ | -------------------------------------------------------------------------------------|
| `original`      | string | The original input text.                                                             |
| `analysis`      | object | Sentiment analysis result.                                                           |
| `score`         | number | Ranges from -5 (very negative) to 5 (very positive).                                 |
| `sentiment`     | string | One of: `"very negative"`, `"negative"`, `"neutral"`, `"positive"`, `"very positive"`.|
| `explanation`   | string | A brief explanation of the sentiment result.                                         |
| `model`         | string | The AI model used (`deepseek-r1:1.5b`).                                              |
| `raw_response`  | string | The raw string response returned by Deepseek.                                        |



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

