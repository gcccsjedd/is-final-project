# NLP Agent API

This API provides comprehensive natural language processing capabilities, including:

- **Sentiment Analysis**: Determine the emotional tone of text
- **Text Summarization**: Create concise summaries of longer texts
- **Text Classification**: Categorize text into predefined categories
- **Language Detection**: Identify the language of written text
- **Keyword Extraction**: Extract the most important terms from text

The API combines rule-based algorithms with the power of the deepseek-coder-1.5b-instruct model running locally via Ollama.

## API Endpoint

- **Endpoint**: `/api/team-FlexHax-NLPagent`
- **Method**: POST

## Testing with Postman

To test the API using Postman:

1. Start your Svelte development server:
   ```
   npm run dev
   ```

2. Open Postman and create a new request:
   - Method: POST
   - URL: `http://localhost:5173/api/team-FlexHax-NLPagent`
   - Headers: 
     - Key: `Content-Type`
     - Value: `application/json`

3. Set the request body to `raw` JSON format and use the examples below for testing different NLP tasks.

## Input Parameters

The API accepts JSON data with the following structure:

```json
{
  "text": "The text content to analyze or process",
  "task": "sentiment | summarize | classify | detect-language | extract-keywords",
  "options": {
    "maxLength": 200,
    "minLength": 50,
    "categories": ["technology", "business", "health"],
    "keywordCount": 5
  }
}
```

### Required Parameters

- `text`: The text content to process (string, 1-5000 characters)
- `task`: The NLP task to perform (string, one of the supported tasks)

### Optional Parameters

The `options` object contains task-specific parameters:

#### For Summarization

- `maxLength`: Maximum length for the summary (number, 1-1000)
- `minLength`: Minimum length for the summary (number, 1-500)

#### For Classification

- `categories`: Array of categories to classify text into (if not provided, default categories are used)

#### For Keyword Extraction

- `keywordCount`: Number of keywords to extract (number, 1-20)

## Output Format

The API returns JSON with the following structure, depending on the task:

### Sentiment Analysis

```json
{
  "result": {
    "sentiment": "positive | negative | neutral",
    "score": 0.75,
    "confidence": 0.85,
    "modelUsed": "deepseek | rule-based"
  }
}
```

### Text Summarization

```json
{
  "result": {
    "text": "The original input text",
    "summary": "The generated summary",
    "originalLength": 500,
    "summaryLength": 150,
    "compressionRatio": 0.3,
    "modelUsed": "deepseek | extractive"
  }
}
```

### Text Classification

```json
{
  "result": {
    "text": "The input text",
    "category": "technology",
    "confidence": 0.8,
    "allCategories": [
      { "category": "technology", "confidence": 0.8 },
      { "category": "business", "confidence": 0.15 },
      { "category": "health", "confidence": 0.05 }
    ],
    "modelUsed": "deepseek | tf-idf"
  }
}
```

### Language Detection

```json
{
  "result": {
    "text": "The input text",
    "detectedLanguage": "English",
    "confidence": 0.95,
    "possibleLanguages": [
      { "language": "English", "confidence": 0.95 },
      { "language": "French", "confidence": 0.03 },
      { "language": "German", "confidence": 0.02 }
    ],
    "modelUsed": "deepseek | pattern-based"
  }
}
```

### Keyword Extraction

```json
{
  "result": {
    "text": "The input text",
    "keywords": [
      { "keyword": "artificial", "score": 1.0 },
      { "keyword": "intelligence", "score": 0.9 },
      { "keyword": "neural", "score": 0.7 },
      { "keyword": "networks", "score": 0.6 },
      { "keyword": "learning", "score": 0.5 }
    ],
    "modelUsed": "deepseek | tfidf"
  }
}
```

## Example Postman Requests

### Sentiment Analysis

Request Body:
```json
{
  "text": "I really enjoyed using this product. It works great and exceeds expectations!",
  "task": "sentiment"
}
```

### Text Summarization

Request Body:
```json
{
  "text": "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term 'artificial intelligence' is often used to describe machines (or computers) that mimic cognitive functions that humans associate with the human mind, such as learning and problem solving. As machines become increasingly capable, tasks considered to require intelligence are often removed from the definition of AI, a phenomenon known as the AI effect. For instance, optical character recognition is frequently excluded from things considered to be AI, having become a routine technology.",
  "task": "summarize",
  "options": {
    "maxLength": 100,
    "minLength": 50
  }
}
```

### Text Classification

Request Body:
```json
{
  "text": "The new smartphone features an advanced camera system with AI capabilities that enhance photos automatically.",
  "task": "classify",
  "options": {
    "categories": ["technology", "business", "entertainment"]
  }
}
```

### Language Detection

Request Body:
```json
{
  "text": "Le chat est sur la table. Il dort paisiblement au soleil.",
  "task": "detect-language"
}
```

### Keyword Extraction

Request Body:
```json
{
  "text": "Artificial intelligence and machine learning are revolutionizing technology across various industries including healthcare, finance, and transportation.",
  "task": "extract-keywords",
  "options": {
    "keywordCount": 5
  }
}
```

## Error Handling

The API returns 400 status codes for invalid inputs:

```json
{
  "error": "Error message describing the issue"
}
```

Common error cases:
- Missing or invalid required parameters
- Text exceeding maximum length
- Unsupported task type
- Invalid options for the specified task

## Model Architecture

The NLP agent uses a hybrid approach:

1. **Primary Model**: Uses the Ollama API to access local LLM models
   - Default model: deepseek-coder-1.5b-instruct
   - Can work with any Ollama-compatible model that handles text generation
   - Requires Ollama to be running locally with your chosen model installed

2. **Fallback Algorithms**:
   - **Enhanced sentiment analysis** with weighted lexicons, negation handling, and contextual modifiers
     - Uses a 5-point strength scale for sentiment words
     - Handles negation (e.g., "not good") with a 3-word context window
     - Processes intensifiers and diminishers (e.g., "very good", "somewhat good")
     - Calculates confidence based on sentiment magnitude, consistency, and content amount
   - **Advanced extractive summarization** using TF-IDF, position importance, and topic coherence
     - Identifies potential titles and headings
     - Applies higher weight to key sentences based on position and content
     - Normalizes scores to prevent bias toward longer sentences
     - Ensures topic coverage by selecting sentences with diverse keywords
   - **Improved text classification** with weighted keywords and n-gram analysis
     - Uses a 5-point weight scale for category-specific keywords
     - Recognizes multi-word phrases and technical terminology 
     - Performs n-gram analysis to detect partial matches and related terms
     - Calculates confidence scores based on relative match strength across categories
   - Pattern-based language detection using character sets and stop words
   - TF-IDF based keyword extraction

The system will automatically use the deepseek model when available and fall back to the built-in algorithms when the model is unavailable or fails.

## Troubleshooting

- If receiving a 400 error, check that your input meets the requirements
- Ensure the text is not empty and within the size limits
- Verify the task parameter is one of the supported values
- For task-specific options, ensure they are within valid ranges
- If modelUsed consistently shows fallback algorithms instead of "deepseek", check that:
  - Ollama is running locally (`ollama serve`)
  - The deepseek-coder-1.5b-instruct model is installed (`ollama pull deepseek-coder-1.5b-instruct`)
  - Your network can reach localhost:11434 

## Using Alternative Models

This API is designed to work with any model available through Ollama. While it uses deepseek-coder-1.5b-instruct by default, you can modify the source code to use any other compatible model:

1. The system will work completely offline using its built-in algorithms if no model is available
2. For better results, you can use any Ollama-compatible model such as:
   - llama2
   - mistral
   - phi2
   - gemma
   - and others

To use a different model, simply modify the `modelName` parameter in the `callDeepseekModel` function in `+server.ts`.

All model requests use straightforward text prompts that should work with most general-purpose language models.

## Confidence Scores

All confidence and score values in this API use a standardized scale from 0 to 1:
- 1.0 represents the highest possible confidence or score (100%)
- 0.0 represents the lowest possible confidence or score (0%)

Typical confidence values often range between 0.4 and 0.95, with higher values indicating greater certainty in the results. Most high-quality matches will show confidence scores between 0.7 and 0.95.

For keyword extraction, scores reflect the relative importance of each keyword, with the most important keyword normalized to 1.0 and others scaled accordingly. 

## Team Members

### API Developer
**John Carlo Hizola**
- Developed the code and handled the API implementation

### Documentation Lead
**Pamintuan Xyrell Dave**
- Sourced possible information and relay

### Git Workflow Manager
**Alloizeus John B. De Belen**
- coordinate development, ensure code quality, and streamline collaboration