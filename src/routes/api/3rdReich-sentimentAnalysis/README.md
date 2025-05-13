# Sentiment Analysis API

A sophisticated Natural Language Processing (NLP) API that performs sentiment analysis on provided text using the DeepSeek language model through Ollama.

## Overview

This API utilizes state-of-the-art NLP techniques to analyze the emotional tone of text, classifying sentiment as positive, negative, or neutral. It leverages the powerful DeepSeek language model to provide accurate and nuanced sentiment detection with confidence scoring.

## API Endpoint

- **URL**: `/api/3rdReich-sentimentAnalysis`
- **HTTP Methods**:
  - `POST` - Analyze sentiment of provided text
  - `GET` - Check API and model availability status

## Technology Stack

- **Framework**: SvelteKit (backend API routes)
- **Language**: TypeScript
- **AI Model**: DeepSeek (any variant, including r1-7b)
- **Model Interface**: Ollama
- **Response Format**: JSON

## Prerequisites

1. **Ollama**: Must be installed and running on your system
   - Download from: [https://ollama.ai/](https://ollama.ai/)

2. **DeepSeek Model**: Must be pulled into Ollama
   - Install with: `ollama pull deepseek:r1-7b` (or any DeepSeek variant)

3. **System Requirements**:
   - At least 8GB RAM (16GB recommended for better performance)
   - At least 10GB free disk space for model storage
   - Modern CPU (GPU recommended for faster inference)

## API Usage

### Sentiment Analysis (POST)

#### Input Parameters

The API accepts JSON input with the following parameters:

| Parameter | Type    | Required | Description                                                 | Constraints           |
|-----------|---------|----------|-------------------------------------------------------------|-----------------------|
| text      | string  | Yes      | The text to analyze for sentiment                           | 1-5000 characters     |
| detailed  | boolean | No       | Whether to return detailed analysis with emotional insights | Default: false        |

#### Example Request

```http
POST /api/3rdReich-sentimentAnalysis HTTP/1.1
Content-Type: application/json

{
  "text": "I really enjoyed the movie. The plot was engaging and the characters were well developed.",
  "detailed": true
}
```

#### Success Responses

##### Standard Response (detailed=false)

```json
{
  "sentiment": "positive",
  "score": 0.92,
  "model": "deepseek:r1-7b",
  "text": "I really enjoyed the movie. The plot was engaging and the characters were well developed."
}
```

Where:

- `sentiment`: Either "positive", "negative", or "neutral"
- `score`: A number between 0 and 1 indicating confidence (higher = more confident)
- `model`: The specific DeepSeek model version used for analysis
- `text`: The original input text

##### Detailed Response (detailed=true)

```json
{
  "result": {
    "sentiment": "positive",
    "score": 0.92,
    "key_phrases": ["really enjoyed", "engaging", "well developed"],
    "analysis": "The text shows strong positive sentiment with emphasizing words like 'really' and appreciative adjectives like 'engaging' and 'well developed'. There are no negative phrases or qualifiers."
  },
  "model": "deepseek:r1-7b",
  "text": "I really enjoyed the movie. The plot was engaging and the characters were well developed."
}
```

The detailed response provides:

- Sentiment classification (positive, negative, neutral)
- Confidence score (0-1)
- Key emotional phrases extracted from the text
- Detailed analysis explaining the sentiment determination

### API Status Check (GET)

#### Example Request

```http
GET /api/3rdReich-sentiment HTTP/1.1
```

#### Success Response

```json
{
  "status": "online",
  "message": "Sentiment Analysis API is running. Please use POST method with text payload.",
  "ollama_available": true,
  "model": "deepseek:r1-7b",
  "api_version": "1.0.0"
}
```

Where:

- `status`: API operational status
- `ollama_available`: Whether Ollama is running and accessible
- `model`: The specific DeepSeek model available or status message
- `api_version`: The current version of this API

## Error Handling

The API implements comprehensive error handling to provide clear feedback for various failure conditions.

### 400 Bad Request

Invalid input format or validation failure:

```json
{
  "error": "Invalid input",
  "details": "Text must be between 1 and 5000 characters"
}
```

### 500 Internal Server Error

Model processing error:

```json
{
  "error": "Model processing error",
  "message": "No DeepSeek model available. Please install a DeepSeek model with Ollama."
}
```

Invalid model response:

```json
{
  "error": "Invalid model response",
  "message": "The model didn't return valid JSON. Please try again.",
  "raw_response": "..."
}
```

## Implementation Details

### Architecture

1. **Request Validation**: Strict validation of input parameters
2. **Model Discovery**: Dynamic detection of available DeepSeek models
3. **Prompt Engineering**: Carefully designed prompts for consistent JSON responses
4. **Response Parsing**: Robust parsing with error handling
5. **Format Standardization**: Consistent response structure

### How It Works

1. The API receives a POST request with text for analysis
2. Input is validated according to schema requirements
3. The API checks for available DeepSeek models via Ollama
4. A specialized prompt is crafted based on the detailed parameter
5. The text is sent to the DeepSeek model for analysis
6. The model's response is parsed and validated
7. A standardized JSON response is returned to the client

## Code Examples



### JavaScript (Fetch)

```javascript
fetch('/api/3rdReich-sentimentAnalysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'I really enjoyed the movie. The plot was engaging and the characters were well developed.',
    detailed: false
  }),
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Python (Requests)

```python
import requests
import json

url = "https://your-domain.com/api/3rdReich-sentiment"
payload = {
    "text": "I really enjoyed the movie. The plot was engaging and the characters were well developed.",
    "detailed": True
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.json())
```

## Troubleshooting

### Common Issues

1. **Model Not Found**:
   - Error: `"No DeepSeek model available. Please install a DeepSeek model with Ollama."`
   - Solution: Run `ollama pull deepseek:r1-7b` or check that Ollama is running

2. **Request Timeout**:
   - Symptom: Request hangs or times out
   - Solution: For long text inputs, the model might take longer to process. Consider using shorter text or increasing your client timeout.

3. **Invalid JSON Response**:
   - Error: `"The model didn't return valid JSON. Please try again."`
   - Solution: This can occasionally happen with complex text. Try again or use `detailed: false` for more reliable responses.

4. **Ollama Connection Error**:
   - Symptom: `"Failed to connect to Ollama service"`
   - Solution: Ensure Ollama is running with `ollama serve` command

## Performance Considerations

- **Response Time**: Typically 1-5 seconds depending on text length and system resources
- **Concurrent Requests**: The API can handle multiple concurrent requests, limited by Ollama's capabilities
- **Text Length**: Performance degrades with very long texts (>1000 characters)
- **Memory Usage**: Higher for detailed analysis and longer texts

## Security Considerations

- This API does not store or log analyzed text
- No authentication is required by default (implement based on your needs)
- Rate limiting should be implemented at the application level
- Consider additional validation for production use

