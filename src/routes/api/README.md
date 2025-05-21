# AI Text Summarizer API Documentation

This API generates concise summaries from input text using a locally hosted `deepseek-r1:1.5b` model via Ollama.

---

## 🚀 API Endpoint

| Method | Endpoint          | Description                  |
|--------|-------------------|------------------------------|
| POST   | `/api/cosmos-npl` | Generate a summary from text |

---

## 📥 Input Parameters

**Content-Type:** `application/json`

| Field | Type   | Required | Description           |
|-------|--------|----------|-----------------------|
| text  | string | ✅ Yes   | The text to summarize |

### Example Request Body
```json
{
  "text": "Employees’ absence must only be allowed if there is valid reason and must inform the management..."
}
```

---

## 📤 Output Format

**Content-Type:** `application/json`

### Example Successful Response
```json
{
  "success": true,
  "summary": "Employees must notify managers for valid absences and submit written explanation for late arrivals.",
  "model": "deepseek-r1:1.5b",
  "timestamp": "2025-05-15T02:07:34.503801Z"
}
```

---

## ❌ Error Handling

### 1. 400 Bad Request: Invalid Input
- **Cause:** The `text` field is missing or empty.
- **Fix:** Send a valid JSON body with a non-empty `text` string.

```json
{
  "success": false,
  "error": "Text cannot be empty"
}
```


### 2. 500 Internal Server Error: Ollama Failure
- **Cause:** Ollama is not running or the model is unavailable.
- **Fix:**
```bash
ollama run deepseek-r1:1.5b
```

- **Check model availability:**
```bash
ollama list
```

- **Expected output:**
```
NAME                  ID              SIZE      MODIFIED
deepseek-r1:1.5b      <id>            <size>    <timestamp>
```

- **If not listed:**
```bash
ollama pull deepseek-r1:1.5b
```

---

### 3. Ollama Error: 404 Not Found
- **Cause:** Ollama server is not running or endpoint is incorrect.
- **Fix:**
```bash
ollama serve
```

---

### 4. SyntaxError: Failed to Parse JSON
- **Cause:** Malformed or unexpected JSON returned.
- **Fix:** Use structured, minimal prompts and ensure model output is valid JSON.

---

### 5. Timeouts or No Response
- **Cause:** High system load or long text input.
- **Fix:**
  - Reduce input length  
  - Close unused apps  
  - Restart Ollama if needed

---

## 🔍 General Debugging Tips

- Use `console.error(error)` for logging
- Wrap AI logic in `try/catch`
- Log model output before parsing:
```ts
console.log("Ollama Response:", response);
```
