# rivalscomp API

## Overview
This API uses the Gemma2 Model with data from Marvel Rivals Characters to recommend a list of characters to main based on user's description.##

## Endpoint
- **URL**: `/api/rivalscomp`
- **Method**: `POST`

## Input Parameters
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
      "userDescription": "I want to main a character Tank with good engage and frontline pressure."
  }

## Ollama Model
gemma2:latest

## Sample Output
```json
{
    "userDescription": "I want to main a character Tank with good engage and frontline pressure.",
    "suggestion": {
        "hero": "Doctor Strange",
        "roles": [
            "Vanguard",
            "Frontliner",
            "Tank"
        ],
        "attackRange": "Close Projectile",
        "tier": "B",
        "winRate": 48.84,
        "abilities": "Doctor Strange casts magical daggers, creates protective shields, and uses portals for team mobility. He can ascend briefly, release dark magic for damage, and his ultimate stuns enemies by separating their souls, transferring damage. His passive accumulates dark magic, risking anti-heal if not released.",
        "strengths": [
            "Shield of the Seraphim absorbs all projectiles and some Ultimates.",
            "Ultimate, Eye of Agamotto, stuns and deals extra damage via soul projection."
        ],
        "weaknesses": [
            "Limited mobility due to long cooldown on Cloak of Levitation.",
            "Vulnerable if Shield of the Seraphim is destroyed."
        ],
        "teamup": {
            "teamUpName": "Arcane Order",
            "effect": "Doctor Strange replaces Scarlet Witch's Chthonia Burst with Mystic Burst, an attack that allows her to fire a salvo of missiles. Doctor Strange gets additional 150 max health."
        }
    },
    "explanation": "Here are details about Doctor Strange which best matches your request.",
    "legalNotice": "rivals-comps is not endorsed by Marvel or NetEase Games"
}