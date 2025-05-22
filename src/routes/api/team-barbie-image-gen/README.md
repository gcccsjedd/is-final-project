# 📸 Image Generation API

This API allows you to generate AI images using OpenAI's DALL·E models (`dall-e-2` or `dall-e-3`) through a `POST` request. You can customize the prompt, number of images, image size, style, quality, and output format.

## 🔗 Endpoint

```
POST /api/team-barbie-image-gen
```

---

## 📝 Request Body

The request body must be a JSON object matching the following schema:

```json
{
  "prompt": "A futuristic city at sunset",
  "amount": 2,
  "size": "1024x1024",
  "style": "vivid",
  "quality": "standard",
  "format": "url",
  "model": "dall-e-3"
}
```

### Fields

| Field     | Type     | Required | Description                              | Default       | Constraints                                                                                              |
| --------- | -------- | -------- | ---------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `prompt`  | `string` | ✅ Yes    | The image prompt to generate.            | —             | Minimum 1 character                                                                                      |
| `amount`  | `number` | ❌ No     | Number of images to generate.            | `1`           | Min: `1`, Max: `10`                                                                                      |
| `size`    | `string` | ❌ No     | Desired size of the output image.        | `"1024x1024"` | **DALL·E 2**: `256x256`, `512x512`, `1024x1024` <br> **DALL·E 3**: `1024x1024`, `1792x1024`, `1024x1792` |
| `style`   | `string` | ❌ No     | The visual style of the generated image. | `"vivid"`     | Options: `vivid`, `natural`                                                                              |
| `quality` | `string` | ❌ No     | Rendering quality of the image.          | `"standard"`  | Options: `standard`, `hd`                                                                                |
| `format`  | `string` | ❌ No     | Output format of the generated image(s). | `"url"`       | Options: `url` (returns image URLs), `b64_json` (returns Base64-encoded JSON images)                     |
| `model`   | `string` | ❌ No     | DALL·E model version to use.             | `"dall-e-3"`  | Options: `dall-e-2`, `dall-e-3`                                                                          |

---

## ✅ Successful Response

```json
{
  {
    "format": "url",
    "images": [
      { 
        "image_url:  "https://image.openai.com/abcd1234.png"
      }
    ]
  }
}
```

* If `format` is `url`: an array of image URLs.
* If `format` is `b64_json`: an array of base64 image data.

### Status Code

* `200 OK` — Image(s) successfully generated.

---

## ❌ Error Responses

### 400 Bad Request

* Missing or invalid parameters.
* Example:

```json
{
  "message": "Error generating image",
  "error": "Prompt is required"
}
```

### 400 Invalid Size for Model

```json
{
  "message": "Invalid size for DALL·E 3",
  "error": "DALL·E 3 only supports sizes: 1024x1024, 1792x1024, 1024x1792"
}
```

### 500 Internal Server Error

* Error during image generation.

```json
{
  "message": "Error generating image",
  "error": "No image generated"
}
```
* Error during formatting response
```json
{
  "message": "Invalid response format"
}
```

---

## 📌 Notes

* `dall-e-2` has limited size support compared to `dall-e-3`.
* Always validate user input before sending requests to this API.

