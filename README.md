# Translation API

This API provides translation capabilities using Hugging Face Transformer models.

## Endpoint

- **URL**: `/api/klein-nlp/translation`
- **Method**: `POST`

## Input Parameters

The API accepts a JSON payload with the following parameters:

```json
{
  "text": "Text to translate", // Required
  "model": "Helsinki-NLP/opus-mt-en-es", 
  "sourceLanguage": "en", 
  "targetLanguage": "es" 
}
```

## Output Format

The API returns a JSON response with the following structure:

```json
{
  "original": "Hello, how are you?",
  "translation": "Hola, ¿cómo estás?",
  "model": "Helsinki-NLP/opus-mt-en-es"
}
```

## Error Handling

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

## Example Usage

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

## Available Models

For a full list of available models, visit [Hugging Face Models](https://huggingface.co/models?pipeline_tag=translation). 