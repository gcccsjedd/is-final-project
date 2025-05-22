
# 🚀 Natural Language Google Maps Agent API

This API allows users to submit a **natural language prompt** (e.g., "Find internet cafes in Olongapo City" or "How do I get from Skydev Solutions to Victory Terminal?"), and automatically detects whether the query is related to **Google Places** or **Google Directions**. It then uses LangChain with the appropriate tool to return a formatted response.

---

## 📌 Endpoint

```
POST /api/coderist-google-maps-agent
```

### Request Body

```json
{
    "prompt": "Your natural language query here"
}
```

#### Example

```json
{
  "prompt": "Find internet cafes in Olongapo City"
}
```

---

## 📤 Response

### 1. 📍 Places Mode

Triggered when the user is asking about **locations**, **venues**, or **places** (e.g., restaurants, internet cafes, hotels, etc.).

#### Example Prompt

```json
{
  "prompt": "Find internet cafes in Olongapo City"
}
```

#### Example Response

```json
{
  "response": {
    "output": "The internet cafes in Olongapo City, Philippines are GVortex gaming Hub, Wamfae Internet Cafe, RRGB Internet Cafe, Coffee Cai Cafe, Bluenet Cafe, Anh Bhambu Internet Cafe, Ashong gaming, cyberkz internet cafe, 727 Coffee & Co., Ryzenation Internet and Gaming Cafe, G.com Internet Cafe, Gabby's Game Zone & i-cafe, Net2go Internet Cafe, But First, Coffee (BFC) - Olongapo, Features, Gamer’s Alley, The Coffee Shop, Mtea Niners Cafe - Olongapo City, Minntrix Haven Resto and Internet, C.O. Computer Center."
  }
}
```

---

### 2. 🛣️ Directions Mode

Triggered when the user is asking how to get from one place to another.

#### Example Prompt

```json
{
  "prompt": "Skydev Solutions Olongapo City to Victory Terminal Olongapo City"
}
```

#### Example Response

```json
{
  "response": {
    "input": "skydev solutions Olongapo City to Victory Terminal Olongapo City",
    "output": "I found two routes from Skydev Solutions in Olongapo City to Victory Terminal in Olongapo City by car:\n\n1. Route via 14th St:\n - Distance: 3.7 km\n - Duration: 10 mins\n\n2. Alternative Route via Rizal Hwy:\n - Distance: 3.9 km\n - Duration: 12 mins\n\nThese are the two options you have for driving to Victory Terminal."
  }
}
```

---

## 🔐 Environment Variables

Before deploying or running the project, define the following environment variables:

| Variable                | Description                   |
| ----------------------- | ----------------------------- |
| `GOOGLE_PLACES_API_KEY` | API key for Google Places API |
| `GOOGLE_ROUTES_API_KEY` | API key for Google Routes API |
| `OPENAI_API_KEY`        | API key for OpenAI GPT-3.5    |

Example `.env`:

```env
GOOGLE_PLACES_API_KEY=your_google_places_key
GOOGLE_ROUTES_API_KEY=your_google_routes_key
OPENAI_API_KEY=your_openai_api_key
```

These values are securely loaded from `$env/static/private` using SvelteKit.

---

## ⚙️ How It Works

1. The user sends a **natural language prompt** to the `/api/maps-agent` endpoint.
2. The backend uses **Ollama** (e.g., LLaMA 3) to classify the prompt as either:

   * `places`
   * `directions`
3. Depending on the classification:

   * For **places**, the system uses `GooglePlacesAPI` from LangChain to query Google Places.
   * For **directions**, the system uses `GoogleRoutesAPI` from LangChain to retrieve route information.
4. The result is returned in a structured JSON format, suitable for direct frontend use.

---

## 📦 Tech Stack & Dependencies

* [SvelteKit](https://kit.svelte.dev/)
* [LangChain JS](https://js.langchain.com/)
* [OpenAI](https://platform.openai.com/)
* [Ollama](https://ollama.com/)
* [Google Maps Platform](https://developers.google.com/maps)

---

## 🧪 Example Usage (Local)

You can test locally using tools like `curl`, Postman, or Thunder Client.

```bash
curl -X POST http://localhost:5173/api/maps-agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Find restaurants in Subic Bay"}'
```
