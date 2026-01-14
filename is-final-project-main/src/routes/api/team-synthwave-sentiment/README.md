# Team Synthwave Sentiment API 🔮

## 🚀 Quick Start

1. **Install Dependencies**

   ```bash
   bun install @sveltejs/kit zod express-rate-limit ollama
   ```

2. **Start Ollama**

   ```bash
   ollama serve
   # In another terminal
   ollama pull llama3
   ```

3. **Run Dev Server**
   ```bash
   bun run dev --port 5173
   ```

## 📡 API Endpoint

`POST /api/team-synthwave-sentiment`

### Request

```json
{
	"text": "Your text to analyze (1-1000 characters)"
}
```

### Response

```json
{
  "sentiment": "positive|neutral|negative",
  "score": -5.0 to 5.0
}
```

## 🛠️ Usage Examples

### PowerShell

```powershell
$body = @{text="This works perfectly!"} | ConvertTo-Json -Compress
Invoke-RestMethod -Uri 'http://localhost:5173/api/team-synthwave-sentiment' `
  -Method Post `
  -ContentType 'application/json' `
  -Body $body
```

### cURL

```bash
curl.exe -X POST http://localhost:5173/api/team-synthwave-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text":"This implementation works!"}'
```

## 🔒 Rate Limits

- 100 requests/15 minutes
- Tracked via `X-RateLimit-*` headers

## 🐛 Troubleshooting

1. Verify Ollama service:
   ```bash
   ollama list
   curl.exe http://localhost:11434/api/tags
   ```
2. Check server logs:
   ```bash
   bun run dev --port 5173
   ```
3. Test with simple input first
