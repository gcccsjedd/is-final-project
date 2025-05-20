# finalproject
This API processes a given text string by:

1. Summing the sentiment values of the words.
2. Returning:
   - A **sentiment label**: `"positive"`, `"neutral"`, or `"negative"`
   - A **numeric score** (positive > 0, neutral = 0, negative < 0)

# Use Cases

- Customer feedback analysis  
- Social media sentiment tracking  
- AI chatbots & virtual agents  
- Emotion detection in messages  
- Academic NLP experiments

# Getting Started

1. Clone the Repository
https://github.com/geeer123/finalproject.git
2. Install Dependencies
npm install
3. Start the Dev Server
npm run dev -- --open


### API Endpoint and HTTP Method

POST /api/team-Infernet/translate

- Method: POST
- Content-Type: application/json

---

### Input Parameters

- text (string, required): The input sentence or paragraph to be analyzed for sentiment.

Example Input:
{
  "text": "I love you"
}

---

### Output Format

Returns a JSON response with the following fields:

- sentiment: "positive", "neutral", or "negative"
- score: a number representing overall sentiment strength

Example Output:
{
  "sentiment": "positive",
  "score": 3
}

---

### Example Request/Response

Request using curl:
curl -X POST http://localhost:5173/api/team-InferNet/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"amazing"}'

Response:
{
  "sentiment": "positive",
  "score": 6
}

---

### Error Handling

| Condition           | HTTP Status | Error Message Example                   |
|---------------------|-------------|------------------------------------------|
| Missing text field  | 400         | { "error": "text is required" }          |
| Empty input         | 400         | { "error": "Text must not be empty" }    |
| Invalid JSON        | 400         | { "error": "Invalid JSON" }              |
| Server error        | 500         | { "error": "Internal server error" }     |
