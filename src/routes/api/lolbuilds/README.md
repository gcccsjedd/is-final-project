# lolbuilds API

## Overview
This API uses the Groq AI model with data from League of Legends Champions and items to recommend an item build for a League of Legends champion based on the player's chosen champion and the enemy team composition.

## Endpoint
- **URL**: `/api/lolbuilds`
- **Method**: `POST`

## Input Parameters
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
      "playerChampion": "Ekko",
      "laneOpponent": "Zoe",
      "enemyTeam": ["Darius", "Zoe", "Caitlyn", "Morgana", "Ekko"]
  }