# W3Nash Natural Language Processing (NLP) API

## Overview
This API provides natural language processing capabilities through integration with Vercel's AI SDK and Ollama's language models. It enables text summarization, sentiment analysis, named entity recognition, and keyword extraction using a type-safe TypeScript implementation with Zod validation.

## API Endpoint
- **URL**: `/api/w3nash-nlp`
- **HTTP Method**: POST

## Input Parameters
The API accepts JSON data in the request body with the following structure:

```json
{
  "text": "Text content to be processed",
  "operation": "one-of-supported-operations",
  "options": {
    "maxLength": 200,
    "detailLevel": "basic"
  }
}
```

### Required Fields
- `text`: String (1-5000 characters) - The text content to be processed
- `operation`: String - One of the following operations:
  - `summarize` - Create a concise summary of the text
  - `analyze-sentiment` - Analyze the sentiment of the text
  - `extract-entities` - Extract named entities from the text
  - `generate-keywords` - Extract key terms and phrases from the text

### Optional Fields
- `options`: Object - Additional configuration options
  - `maxLength`: Number - Maximum length for summarization (default: 30% of original)
  - `detailLevel`: String - Detail level for analysis, either 'basic' or 'detailed' (default: 'basic')

## Output Format
The API returns JSON responses with different structures based on the requested operation:

### Summarize Response
```json
{
  "summary": "Concise version of the original text...",
  "originalLength": 1200,
  "summaryLength": 320
}
```

### Sentiment Analysis Response
```json
{
  "sentiment": "positive",
  "score": 0.75,
  "confidence": 0.85,
  "analysis": "The text contains predominantly positive language..."
}
```

### Entity Extraction Response
```json
{
  "entities": [
    {
      "text": "Microsoft",
      "type": "organization",
      "confidence": 0.95
    },
    {
      "text": "United States",
      "type": "location",
      "confidence": 0.97
    }
  ]
}
```

### Keyword Extraction Response
```json
{
  "keywords": [
    {
      "text": "artificial intelligence",
      "relevance": 0.92
    },
    {
      "text": "machine learning",
      "relevance": 0.87
    }
  ]
}
```

## Example Requests and Responses

### Text Summarization

**Request:**
```bash
curl -X POST http://localhost:5173/api/w3nash-nlp \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to human or animal intelligence. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term artificial intelligence may also be used to describe a property of machines or programs: the intelligence that the system demonstrates.",
    "operation": "summarize",
    "options": {
      "maxLength": 100
    }
  }'
```

**Response:**
```json
{
  "summary": "AI is machine intelligence, defined as the study of intelligent agents that perceive environments and take goal-maximizing actions.",
  "originalLength": 431,
  "summaryLength": 97
}
```

### Sentiment Analysis

**Request:**
```bash
curl -X POST http://localhost:5173/api/w3nash-nlp \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The new AI features are impressive and have greatly improved the user experience!",
    "operation": "analyze-sentiment",
    "options": {
      "detailLevel": "detailed"
    }
  }'
```

**Response:**
```json
{
  "sentiment": "positive",
  "score": 0.82,
  "confidence": 0.91,
  "analysis": "The text expresses enthusiasm with positive terms like 'impressive' and 'greatly improved', indicating satisfaction with the AI features."
}
```

### Entity Extraction

**Request:**
```bash
curl -X POST http://localhost:5173/api/w3nash-nlp \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Microsoft announced its new AI products on Tuesday. The event was held in Seattle and attended by CEO Satya Nadella. The company plans to release these tools by January 2026.",
    "operation": "extract-entities"
  }'
```

**Response:**
```json
{
  "entities": [
    {
      "text": "Microsoft",
      "type": "organization",
      "confidence": 0.98
    },
    {
      "text": "Tuesday",
      "type": "date",
      "confidence": 0.87
    },
    {
      "text": "Seattle",
      "type": "location",
      "confidence": 0.95
    },
    {
      "text": "Satya Nadella",
      "type": "person",
      "confidence": 0.96
    },
    {
      "text": "January 2026",
      "type": "date",
      "confidence": 0.92
    }
  ]
}
```

### Keyword Extraction

**Request:**
```bash
curl -X POST http://localhost:5173/api/w3nash-nlp \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.",
    "operation": "generate-keywords"
  }'
```

**Response:**
```json
{
  "keywords": [
    {
      "text": "machine learning",
      "relevance": 0.95
    },
    {
      "text": "artificial intelligence",
      "relevance": 0.87
    },
    {
      "text": "automatically learn",
      "relevance": 0.82
    },
    {
      "text": "improve from experience",
      "relevance": 0.78
    },
    {
      "text": "computer programs",
      "relevance": 0.72
    },
    {
      "text": "access data",
      "relevance": 0.65
    }
  ]
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid input parameters
  ```json
  {
    "error": "Invalid request data",
    "details": { /* validation error details */ }
  }
  ```

- `500 Internal Server Error`: Server-side processing errors
  ```json
  {
    "error": "Failed to process request",
    "message": "Error details..."
  }
  ```

## Requirements
- Ollama running locally on port 11434 with the `llama3` model
- Bun/Node.js environment with SvelteKit
- Dependencies:
  - Vercel AI SDK (`ai` package)
  - Ollama AI Provider (`ollama-ai-provider` package)
  - Zod validation library (`zod` package)
  - TypeScript

## Technical Implementation

The API is built using the following technologies:

- **Vercel AI SDK**: Provides the core AI functionality and streaming capabilities
- **ollama-ai-provider**: A community provider that connects the AI SDK to Ollama's local models
- **Zod**: A TypeScript-first schema validation library for input validation
- **TypeScript**: For type safety and improved developer experience
- **SvelteKit**: For API route handling and server-side logic

## Troubleshooting
1. If you encounter "Failed to connect to Ollama" errors, ensure Ollama is running:
   ```bash
   ollama serve
   ```

2. If the model is unavailable, pull it first:
   ```bash
   ollama pull llama3
   ```

3. If experiencing type errors, verify that all dependencies are correctly installed:
   ```bash
   bun add ai ollama-ai-provider zod
   ```
