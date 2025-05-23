Sentiment Analysis API

This API provides real-time sentiment analysis of user-supplied text. It classifies each input as positive, neutral, or negative, and returns a numeric score representing the strength of the sentiment (positive > 0, neutral = 0, negative < 0).

---

Overview

What it does: Takes a text string, analyzes each word’s sentiment weight (from a built-in lexicon), sums them, and returns:
  1. A sentiment label: positive, neutral, or negative
  2. A numeric score indicating overall sentiment strength

Use cases: Customer feedback analysis, social media monitoring, chatbots, or any app needing emotional context.

---

Getting Started

1. Clone the repository
   git clone https://github.com/your-org/your-repo.git
   cd your-repo

2. Install dependencies
   npm install

3. Start the development server
   npm run dev -- --open
   This will launch SvelteKit at http://localhost:5173 (opens automatically).

4. Try it out in the browser
   Navigate to http://localhost:5173/, type text, and click Analyze Sentiment.
   Or use curl:
   curl -X POST http://localhost:5173/api/team-alpha-nlp/translate \
     -H "Content-Type: application/json" \
     -d '{"text":"I love this project!"}'

---

API Endpoint

POST /api/team-alpha-nlp/translate

Content-Type: application/json
Body: JSON object matching schema.json

---

Input Schema (schema.json)

{
  "type": "object",
  "properties": {
    "text": { "type": "string", "minLength": 1 }
  },
  "required": ["text"]
}

Field:
  text (string, required): The non-empty text to analyze.

---

Response Format

Content-Type: application/json
Success (200):
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": <number>
}

---

Examples

Request:
curl -X POST http://localhost:5173/api/team-alpha-nlp/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"I love this project!"}'

Response:
{
  "sentiment": "positive",
  "score": 3
}

---

Error Handling

400 Bad Request (missing or empty text):
{ "error": "Text is required" }

500 Internal Server Error (unexpected failure):
{ "error": "Failed to analyze text" }

---

File Structure

src/routes/api/team-alpha-nlp/
├── translate/
│   └── +server.ts        # API implementation (POST /translate)
├── schema.json           # JSON schema for input validation
└── README.md             # This documentation
