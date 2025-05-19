# 🧠 Text Summarization API (using Gemma 3B)

This API provides a simple interface to summarize long text using the `gemma-3b` model (Gemma 3:4b). You can send raw text, and the API returns a concise, human-readable summary.

---

## 📌 Endpoint

`POST /api/generate`

---

## 📥 Input Parameters
Example input parameters: Malcolm X (May 19, 1925 – February 21, 1965) was an African American Muslim minister, public speaker, and human rights activist. To his admirers, he advocated for the rights of African Americans and indicted white America for their actions against black Americans. His detractors accused him of preaching racism and violence. After living in foster homes, Malcolm X was involved in criminal activity in Boston and New York. In 1945, he was sentenced to prison, where he became a member of the Nation of Islam. After his parole, he became one of the Nation's leaders, its chief spokesmen, and its public face. Tension between Malcolm X and Elijah Muhammad, head of the Nation of Islam, led to Malcolm X's departure from the organization in March 1964. Afterwards, he became a Sunni Muslim and made a pilgrimage to Mecca. He founded Muslim Mosque, Inc., a religious organization, and the secular, black nationalist Organization of Afro-American Unity. He was assassinated while giving a speech in New York. (Full article...)

### Content-Type
`application/json`

### Request Body

JSON output: 
{
    "message": "Please provide me with the text you would like me to summarize! I need the text itself to be able to fulfill your request. 😊 \n\nOnce you paste the text here, I’ll do my best to give you a short and concise summary."
}

Example Request/Response: 
Summary:
Here’s a concise summary of the project:

This project requires teams of three to develop an AI agent using Svelte, Bun, and Ollama within a GitHub repository. Teams will design and implement a functional API, choosing from options like NLP, image generation, or image processing. Key requirements include utilizing Git workflows (branching, pull requests), thorough documentation (including API schemas), and a 5-minute demo showcasing their agent’s functionality and challenges. Deadlines for submission and demo are May 11, 2025 (11:59 PM) and May 12-18, 2025, respectively. Teams must adhere to strict guidelines regarding collaboration, documentation, and originality.


Error Handling: 

status (400) "Missing required field" 
status (500) "Model failed to respond"
status (200) "Response Ok" 