# Klein NLP API

This API provides various natural language processing capabilities including translation, summarization, and sentiment analysis.

## Translation Endpoint

- **URL**: `/api/klein-nlp/translation`
- **Method**: `POST`

### Input Parameters

The API accepts a JSON payload with the following parameters:

```json
{
  "text": "Text to translate", // Required
  "model": "Helsinki-NLP/opus-mt-en-es", 
  "sourceLanguage": "en", 
  "targetLanguage": "es" 
}
```

### Output Format

The API returns a JSON response with the following structure:

```json
{
  "original": "Hello, how are you?",
  "translation": "Hola, ¿cómo estás?",
  "model": "Helsinki-NLP/opus-mt-en-es"
}
```

### Error Handling

The API returns the following errors:

- **400 Bad Request**: If the text parameter is missing
  ```json
  {
    "error": "Text is required"
  }
  ```

- **500 Internal Server Error**: If there's an error with the translation service
  ```json
  {
    "error": "Translation service error",
    "message": "Error details"
  }
  ```

### Example Usage

```javascript
// Example: Translate English to French
const response = await fetch('/api/klein-nlp/translation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello, how are you?',
  }),
});

const result = await response.json();
console.log(result.translation);
```

### Available Models

For a full list of available models, visit [Hugging Face Models](https://huggingface.co/models?pipeline_tag=translation).






## Summarization Endpoint

- **URL**: `/api/klein-nlp/summarization`
- **Method**: `POST`

### Input Parameters

The API accepts a JSON payload with the following parameters:

```json
{
  "text": "Text to summarize" // Required
}
```

### Output Format

The API returns a JSON response from the Ollama API, which includes the summarized text.

### Error Handling

The API returns the following errors:

- **400 Bad Request**: If the text parameter is missing
  ```json
  {
    "error": "Text is required"
  }
  ```

- **500 Internal Server Error**: If there's an error with the summarization service
  ```json
  {
    "error": "Internal server error"
  }
  ```

### Example Usage

```javascript
// Example: Summarize a long text
const response = await fetch('/api/klein-nlp/summarization', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...',
  }),
});

const result = await response.json();
console.log(result);
```






## Sentiment Analysis Endpoint

- **URL**: `/api/klein-nlp/sentiment`
- **Method**: `POST`

### Input Parameters

The API accepts a JSON payload with the following parameters:

```json
{
  "text": "Text to analyze for sentiment" // Required
}
```

### Output Format

The API returns a JSON response from the Ollama API, which typically includes sentiment analysis information in the following format:

```json
{
  "sentiment": "positive",
  "confidence": 0.85,
  "explanation": "The text contains positive language and expressions of satisfaction."
}
```

### Error Handling

The API returns the following errors:

- **400 Bad Request**: If the text parameter is missing
  ```json
  {
    "error": "Text is required"
  }
  ```

- **500 Internal Server Error**: If there's an error with the sentiment analysis service
  ```json
  {
    "error": "Internal server error"
  }
  ```

### Example Usage

```javascript
// Example: Analyze sentiment of a text
const response = await fetch('/api/klein-nlp/sentiment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'I really enjoyed using this product. It exceeded my expectations!',
  }),
});

const result = await response.json();
console.log(result);
```

## Implementation Details

All endpoints are powered by language models:
- The translation endpoint uses Hugging Face Transformer models
- The summarization and sentiment analysis endpoints use Ollama API with the llama3.2 model
