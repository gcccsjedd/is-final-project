
##### Documentation
Include a README.md in your branch with:
- API endpoint and expected HTTP method (GET/POST)
- Input parameters (JSON/query params/form data)
- Output format (JSON, image, text)
- Example request/response
- Error handling (possible failure cases) or troubleshooting guide.

##### 1. API Endpoint & HTTP Method
(GET)  Enter URl: http://localhost:5173/api/sample
(POST) Enter URL: http://localhost:5173/api/404notfound-nlp


##### 2. Input Parameters (JSON)
| Field       | Type    | Required | Default Value         |
|-------------|---------|----------|------------------------|
| text        | string  | Yes      | -                      |
| model       | string  | No       | "mistral-7b-instruct"  |
| max_tokens  | number  | No       | 150                    |
| temperature | number  | No       | 0.7                    |




##### 4. Example request/response
##### (POST) http://localhost:5173/api/404notfound-nlp
200 OK
Request:
{
  "text": "Artificial intelligence is transforming industries by automating tasks, improving decision-making, and enabling new applications like self-driving cars and medical diagnostics.",
  "model": "mistral-7b-instruct",
  "max_tokens": 150,
  "temperature": 0.7
}

Response:
{
    "data": {
        "summary": " Artificial Intelligence is revolutionizing various sectors by automating tasks, enhancing decision-making, and introducing innovative applications such as autonomous vehicles and advanced medical diagnostics."
    }
}

##### (GET) http://localhost:5173/api/sample
Request: Send Request

Response:
200 ok
{
    "data": {
        "message": "This is a 404notfound-nlp API response",
        "timestamp": "2025-05-15T03:13:36.231Z",
        "endpoints": [
            {
                "path": "/api/404notfound-nlp",
                "method": "POST",
                "description": "Get text summary using Mistral via OpenRouter",
                "example_request": {
                    "text": "Summarize this article about AI"
                },
                "example_response": {
                    "summary": "The article discusses recent advances in AI..."
                }
            },
            {
                "path": "/api/sample",
                "method": "GET",
                "description": "Get API documentation",
                "example_request": {},
                "example_response": {}
            }
        ],
        "note": "This API uses OpenRouter's free Mistral-7B model"
    }
}
##### 5. Error handling (possible failure cases) or troubleshooting guide.
##### (GET) http://localhost:5173/api/404notfound-nlp
400
Bad Request

{
    "summary": " The French Revolution, commencing in 1789, was a period of radical political, social, and cultural upheaval in France, marked by the overthrow of the Bourbon monarchy, rise of democracy, and the Reign of Terror."
}

{
    "error": "Text is required"
}

#####

405
Method Not Allowed

GET method not allowed

