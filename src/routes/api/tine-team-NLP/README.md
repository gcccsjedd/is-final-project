# 🧠 Sentiment & Emotion Analysis API

This API performs **sentiment** and **emotion** analysis on a given text input using a locally hosted LLaMA2 model via [Ollama](https://ollama.com/).

---

## 🚀 API Endpoint

| Method | Endpoint             | Description                           |
| ------ | -------------------- | ------------------------------------- |
| POST   | `/api/tine-team-NLP` | Analyze sentiment & emotion from text |

---

## 📥 Input Parameters

**Content-Type:** `application/json`

| Field | Type   | Required | Description         |
| ----- | ------ | -------- | ------------------- |
| text  | string | ✅ Yes   | The text to analyze |

### Example Request Body

```json
{
	"text": "I just got a promotion and I'm so happy!"
}
```

---

## 📤 Output Format

**Content-Type:** `application/json`

### Example Successful Response

```json
{
	"sentiment": "positive",
	"emotion": "joy",
	"confidence": {
		"sentiment": 0.92,
		"emotion": 0.87
	}
}
```

---

## ❌ Error Handling

### 1. **400 Bad Request: Invalid Input**

- **Cause:** Missing or empty `"text"` field, or non-string value.
- **Fix:** Send a valid JSON body with a non-empty `"text"` string.

```json
{
	"error": "Invalid input. Please provide non-empty \"text\"."
}
```

---

### 2. **500 Internal Server Error: Ollama Failure**

- **Cause:** Ollama isn't running or the model isn't available.s
- **Fix:**

  ```bash
  ollama run llama2
  ```

- **Check model availability:**

  ```bash
  ollama list
  ```

- **Expected output:**

  ```
  NAME             ID              SIZE      MODIFIED
  llama2:latest    <id>            <size>    <timestamp>
  ```

- **If not listed:**
  ```bash
  ollama pull llama2
  ```

---

### 3. **Ollama Error: 404 Not Found**

- **Cause:** Ollama server not started or incorrect endpoint.
- **Fix:**
  ```bash
  ollama serve
  ```

---

### 4. **SyntaxError: Failed to parse JSON**

- **Cause:** Ollama returned non-JSON or malformed output.
- **Fix:** Ensure your prompt requests strictly formatted JSON. Wrap your sample JSON response in triple quotes in the prompt to reduce natural language formatting.

---

### 5. **Timeouts or No Response**

- **Cause:** Heavy system load or long prompt processing.
- **Fix:**
  - Close heavy applications
  - Use simpler prompts
  - Ensure Ollama isn't stuck

---

## 🔍 General Debugging Tips

- Log errors using `console.error(error)`
- Use `try/catch` when handling AI responses
- Log raw response before parsing:

```ts
console.log("Raw Ollama Response:", result.response);
```
