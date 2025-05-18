# api documentation

this directory contains the ai-powered text summarization api endpoint.

---

## summarize api

**endpoint:** `/api/summarize`  
**method:** `POST`

### input parameters (json)
```json
{
  "text": "your text to summarize",
  "max_length": 50
}
```
- `text` (string, required): the text to summarize
- `max_length` (number, optional): maximum words for the summary (default: 100)

### output format (json)
```json
{
  "summary": "short summary here",
  "original_text": "your text to summarize",
  "set_max_length": 50
}
```
- `summary`: generated summary
- `original_text`: original input text
- `set_max_length`: word limit used

### example request
```http
POST /api/summarize
Content-Type: application/json

{
  "text": "artificial intelligence is a field of computer science...",
  "max_length": 30
}
```

### example response
```json
{
  "summary": "artificial intelligence is a branch of computer science focused on creating systems that can perform tasks requiring human intelligence.",
  "original_text": "artificial intelligence is a field of computer science...",
  "set_max_length": 30
}
```

### error handling
- invalid content-type  
  `400 Bad Request`  
  ```json
  { "error": "unsupported content-type. please use \"application/json\"." }
  ```
- missing or invalid `text`  
  `400 Bad Request`  
  ```json
  { "error": "invalid or missing text" }
  ```
- invalid `max_length`  
  `400 Bad Request`  
  ```json
  { "error": "invalid max_length. please provide a number." }
  ```
- internal server error  
  `500 Internal Server Error`  
  ```json
  { "error": "internal server error", "details": "error details" }
  ```

---

## troubleshooting

- always set `content-type: application/json` in your request headers.
- ensure required fields are present and correctly typed.
- check error messages for guidance on fixing input issues.

---

## contributions per member

- **Andrei B. Mayo (API Developer):** implemented the summarization logic and API endpoint.
- **Kiel Rendrix A. Agustin (Documentation Lead):** wrote and structured the API documentation and usage examples.
- **Lee Parker D. Parantar (Git Workflow Manager):** managed branching, pull requests, and code reviews.
