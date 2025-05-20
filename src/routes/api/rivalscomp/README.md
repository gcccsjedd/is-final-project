# rivalscomp API

## Overview
This API uses the Groq AI model with data from Marvel Rivals Characters to recommend a list of characters to main based on user's description.

## Endpoint
- **URL**: `/api/rivalscomp`
- **Method**: `POST`

## Input Parameters
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
      "userDescription": "I want to main a character with low healing output"
  }
