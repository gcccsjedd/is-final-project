# Storytelling AI API

## API Information
- **Endpoint:** `/api/Supercalifragilisticexpialidocious-ImageProcessing`
- **HTTP Method:** POST

## Description
This API generates creative stories based on a base64-encoded image and user-provided tags. The AI analyzes the visual content of the image and incorporates the specified thematic elements to craft an engaging narrative complete with a title.

## Input Parameters
The API accepts JSON data with the following parameters:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `image64Url` | string | Base64-encoded image that serves as the visual inspiration for the story | Yes |
| `tags` | array of strings | Thematic elements or keywords to incorporate into the story | Yes |

## Output Format
The API returns a streaming text response containing the generated story. The response is delivered incrementally as content is generated.

## Example Request
```json
POST /api/Supercalifragilisticexpialidocious-ImageProcessing
Content-Type: application/json

{
  "image64Url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
  "tags": ["adventure", "mystery", "fantasy"]
}
```

## Example Response
```
THE ENCHANTED FOREST

Deep within the emerald heart of the Whispering Woods, where sunlight filtered through ancient trees in dappled patterns, young Elara discovered a hidden door carved into the trunk of a massive oak.

The door, adorned with intricate symbols that seemed to shift when not directly observed, had appeared after a peculiar storm that had raged for three days and three nights.

"There are mysteries in these woods older than time itself," her grandmother had warned her. But curiosity, as it often does, overcame caution.

As Elara placed her palm against the weathered wood, the symbols glowed with an ethereal blue light, and the door swung open silently. Beyond lay not the hollow interior of a tree, but a vast chamber filled with floating orbs of light and pathways that seemed to lead in impossible directions.

A small, leather-bound journal lay on a stone pedestal nearby, its pages filled with maps to realms beyond imagination and warnings of shadows that hungered for light.

Elara had only taken three steps into this impossible place when the door closed behind her, and she realized that finding her way home would be just the beginning of her adventure.

What she didn't yet know was that the forest had chosen her for a reason, and the fate of both worlds now rested on her shoulders.
```

## Error Handling

The API may return the following error responses:

### 400 Bad Request
Returned when the input data fails validation.

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "image64Url",
      "message": "Image data is required"
    }
  ]
}
```

### 500 Internal Server Error
Returned when the API encounters an unexpected error during story generation.

```json
{
  "error": "Failed to process image"
}
```

## Troubleshooting Guide

1. **Invalid Image Format**: Ensure the base64 image string includes the MIME type prefix (e.g., `data:image/jpeg;base64,`)
2. **Empty or Invalid Tags Array**: The tags array must contain at least one string element
3. **Large Image Size**: If the API times out, try using a smaller image (under 10MB after base64 encoding)
4. **Connection Issues**: For streaming responses, ensure your client supports chunked transfer encoding
5. **Model Unavailability**: The API relies on the LLaVa model running on Ollama. If the model is not available, the API will return a 500 error

## Technical Implementation
- This API utilizes the LLaVa model via Ollama for image understanding and story generation
- Input validation is performed using Zod
- Response is delivered as a stream for real-time content delivery

## Dependencies
- Ollama with LLaVa model for multimodal (text+image) processing
- Zod for schema validation and error handling 