# Sentiment Analysis API

## Roles
- Neon John Quiroz - API Developer
- Zaldy Aguilar - Documentation Lead
- Denzel Manz Perez - Git Workflow Manager

## API Endpoint
- **URL**: `/api/generate`
- **Method**: `POST`

## Input Parameters
The API accepts a JSON payload with the following structure:

```json
{
  "userMessage": "<string>"
}
```

- `userMessage` (string): The message to analyze for sentiment. This field is required.

## Output Format
The API returns a JSON response with the following structure:

```json
{
  "sentiment": "<Positive|Negative|Neutral|Unknown>",
  "explanation": "<string>",
  "message": "<string>"
}
```

- `sentiment` (string): The sentiment of the message (`Positive`, `Negative`, `Neutral`, or `Unknown` if it cannot be determined).
- `explanation` (string): A brief explanation of the sentiment analysis result.
- `message` (string): The original message sent in the request.

## Example Request/Response

### Request
```http
POST /api/generate HTTP/1.1
Content-Type: application/json

{
  "userMessage": "I love this product!"
}
```

### Response
```json
{
  "sentiment": "Positive",
  "explanation": "The message expresses a strong positive sentiment.",
  "message": "I love this product!"
}
```

## Error Handling
The API handles errors gracefully and returns appropriate HTTP status codes with error messages.

### Possible Errors

1. **Invalid Content-Type**:
   - **Status Code**: `400`
   - **Response**:
     ```json
     {
       "error": "Unsupported Content-Type. Please use 'application/json'."
     }
     ```

2. **Missing or Invalid `userMessage`**:
   - **Status Code**: `400`
   - **Response**:
     ```json
     {
       "error": "Invalid or missing userMessage"
     }
     ```

3. **Internal Server Error**:
   - **Status Code**: `500`
   - **Response**:
     ```json
     {
       "error": "Internal server error",
       "details": "<error details>"
     }
     ```

## Troubleshooting Guide
- Ensure the `Content-Type` header is set to `application/json`.
- Verify that the `userMessage` field is included in the request body and is a non-empty string.
- Check the server logs for detailed error messages if an internal server error occurs.

