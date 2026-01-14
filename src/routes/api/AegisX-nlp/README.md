# Team AegisX Sentiment Analysis API

## API ENDPOINT
`POST /api/AegisX-nlp/`
`Headers Key: Content-Type Value: application/json`
`EXAMPLE http://localhost:5173/api/AegisX-nlp` 

`GET /api/AegisX-nlp/`
`EXAMPLE http://localhost:5173/api/AegisX-nlp?text=Do%20you%20still%20love%20me..%3F`

## INPUT PARAMETERS
`Postman`

`POST METHOD`
`Body -> Raw`
{
    "text": "Your text to analyze goes here" (non-empty, 0 - 1000 characters)
}

`GET METHOD`
url: http://localhost:5173/api/AegisX-nlp?text=Do%20you%20still%20love%20me..%3F


## OUTPUT FORMAT (JSON)
{
  "sentiment": "positive|neutral|negative",
  "confidence": 0.00-1.00,
  "analysis": "string",
  "key_phrases": ["string"],
  "tones": ["string"]
}

## EXAMPLE REQUEST/RESPONSE
``

`GET/POST RESPONSE:`
{
    "sentiment": "negative",
    "confidence": 0.87,
    "analysis": "The sentiment is negative due to the rhetorical question 'Do you still love me..?' which implies a sense of insecurity and uncertainty, as well as the trailing ellipsis which adds a tone of desperation.",
    "key_phrases": [
        "still",
        "love"
    ],
    "tones": [
        "desperation",
        "insecurity"
    ]
}

## ERROR HANDLING
`400 Error`
- Empty text field
- Non-string text value
- Missing text field

`500 Error`
- Json parsing failure
- Confidence value is out of bounds

If it does not work, consider using a different model.
- ollama pull deepseek-r1:1.5b
- change the MODEL_NAME to "deepseek-r1:1.5b"

`503 Error`
- Ollama service not running
- Model not downloaded/loaded

## TROUBLESHOOTING GUIDE
`Ollama API Error (CMD)`
- Check if ollama is running
curl http://localhost:11434

- If it's not running, start ollama
ollama serve

- Verify if you have downloaded llama3.1:latest
ollama list

- If not downloaded
ollama pull llama3.1:latest

- Folder structure 
- api/AegisX-nlp
-- server.ts
-- README.md
-- schema.json

- Error in import?
- type "npm i" in console of vscode

