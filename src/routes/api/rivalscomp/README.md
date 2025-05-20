# rivalscomp API

## Overview
This API uses the rule-based decision making with data from Marvel Rivals to recommend a team comp based on the enemy team comp.

## Endpoint
- **URL**: `/api/rivalscomp`
- **Method**: `POST`

## Input Parameters
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
      "enemyTeam": ["Thor", "Magneto", "Psylocke", "Magik", "Mantis", "Loki"]
  }