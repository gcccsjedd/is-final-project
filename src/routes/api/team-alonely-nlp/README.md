# Team Alonely - Natural Language Processing Summarizer API

📌 Overview
This API allows users to send long-form text and receive a concise summary using the Deepseek-R1 model running via Ollama.
The response includes the generated summary and basic metadata such as the model used.

This service is intended to aid in text reduction tasks such as summarizing articles, essays, or documentation efficiently.

🛣️ API Endpoint
POST /api/feature/team-alonely-nlp

This is the main endpoint where users can submit text for summarization.

📬 Expected HTTP Method
POST

🧾 Input Parameters
Request Body Format (JSON)
{
  "text": "Your long text goes here. It must be at least 20 characters."
}

💡 Example Request using curl
curl -X POST http://localhost:5173/api/feature/team-alonely-nlp \
  -H "Content-Type: application/json" \
  -d '{"text": "Artificial Intelligence is transforming industries. From personalized education to AI-powered diagnostics in healthcare, it is reshaping how we live and work. Despite its potential, AI also raises concerns about bias, privacy, and job displacement."}'

📤 Output Format
Response (Success)
{
  "summary": "Artificial Intelligence is reshaping industries by enhancing personalization in education and improving healthcare diagnostics through advanced technologies. While it offers significant potential benefits, it also raises important concerns regarding bias, privacy issues, and job displacement as automation becomes more prevalent."
}

❌ Error Handling
Invalid Input (Too Short)
{
  "error": "Input must be a string with at least 20 characters."
}

Malformed Request or Server Error
{
  "error": "Failed to summarize."
}

🛠️ Troubleshooting
Problem	                              Solution
Ollama not running	                  Run ollama serve
Model not installed	                  Use ollama list to check, then run ollama run deepseek-r1
Wrong localhost/port	                Ensure frontend POSTs to: http://localhost:5173
Backend failing silently	            Check your terminal logs for stderr from Ollama subprocess

🔍 Notes
Ensure that Ollama is installed and running locally (http://localhost:11434 by default).
The summarization model currently used is: deepseek-r1
This API summarizes the full input text into one paragraph only.
The text must be long enough (≥20 characters) for meaningful summarization.
