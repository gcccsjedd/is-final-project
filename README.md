# Theoretical General AI Approach - Final Project

# Team SDK Sentiment Analysis API

## Project Overview
- The objective of this project is to create an AI agent utilizing the Svelte, Bun, and Gemini tech stack, which will be hosted on a shared GitHub repository. The primary capability is sentiment analysis, which assesses the emotional tone of text and classifies it as positive, negative, or neutral. This allows for practical applications such as customer feedback analysis and brand impression monitoring.

- Our team’s API is designed to analyze sentiment from text input and optionally generate a marketing tagline based on the detected sentiment. We use the Gemma 3 12B model to power the AI's language understanding and generation capabilities.

- The AI agent aims to simulate certain aspects of a theoretical General AI, such as adaptive reasoning and contextual understanding, moving beyond task-specific models. This project demonstrates how advanced AI can be integrated into real-world applications for smarter, emotion-aware communication.

### Team Formation
- Alberto, Sean Rad P. - API developer
- Banluta, Christian Dave - Git workflow manager
- Flores, Kaye L. - documentation lead

### Documentation
  # API endpoint and expected HTTP method (GET/POST) (API Route starts with "/api")
    ##Account
      #Create Account
        #Description
        Route Type: POST
        Path: /api/account (assuming this file is placed under src/routes/api/account/+server.ts)
        Purpose: To create a new account entry in the database.
        Function Used: createAccount() from server-side database module ($lib/server/db).

        #Request
        Method: POST
        Headers: None required
        Body: None required

        #Response
        Success (201 Created):
        Body: JSON object containing the new account data.
        Headers: Content-Type: application/json

        {
    "id": 2,
    "account_key": "adf7e766-1321-4eae-839d-b12c1cb4e222"
}
        
      #Check Account
        #Description
        Route Type: GET
        Path: /api/account-exists/[id] (assuming this file is placed under src/routes/api/account-exists/[id]/+server.ts)

        #Request: 
        Method: GET
        Headers: None required
        URL Parameter: id (string): The account ID to verify.

        #Purpose: To check whether an account with the given id exists in the database.

        #Function Used: Supabase query using .from('accounts').select('id').eq('id', id).single()

        #Response: Success (200 OK):
        Body: JSON object indicating whether the account exists. 
        Client Error (400 Bad Request):
        Body: JSON object describing the error
        Server Error (500 Internal Server Error):
        Body: JSON object describing the error.

          {
        "exists": true
      } 

    ##Sentiment
      #Create Single Sentiment
        #Descripyion
        Route Type: POST
        Path: /api/sentiment (assuming this file is placed under src/routes/api/sentiment/+server.ts)

        Purpose: To analyze the sentiment of one or more text inputs using Google's Gemini model, generate a summary, and optionally store the results in the database.
        
        Functions Used: 
        - analyzeSentimentWithGemini() from $lib/server/model
        - generateSummaryWithGeminiStream() from $lib/server/model
        - getAverageScore() from $lib/server/model
        - insertSentimentAnalysis() from $lib/server/db

        #Response
        {
    "success": true,
    "analysis": [
        {
            "sentiment": "Positive",
            "score": 92
        }
    ],
    "summary": [
        "The reviewer had a positive experience at FastBite, praising the quick and friendly service, delicious and juicy burgers, crispy fries, clean environment, and reasonable prices. They recommend it for a quick and tasty meal."
    ]
}

      #Create Multiple Sentiment
        #Description
        Route Type: POST
        Path: /api/sentiment (assuming this file is placed under src/routes/api/sentiment/+server.ts)

        #Request:
        Method: POST
        Headers:
          Content-Type: application/json
          Body (JSON):
        Either:
          { "text": string, "account_id"?: string, "account_key"?: string }
        Or:
          { "texts": string[], "account_id"?: string, "account_key"?: string }

        #Purpose:
          To analyze the sentiment of a single text or multiple texts, return the sentiment results and summary, and optionally save the analysis in the database for authenticated users.
        
        #Function Used:
        - analyzeSentimentWithGemini(text: string) — Performs sentiment analysis on a given text.
        - generateSummaryWithGeminiStream(text: string) — Generates a summary of the input text(s).
        - getAverageScore(results: Array<{score: number}>) — Calculates average sentiment score from multiple results.
        - insertSentimentAnalysis(data) — Saves sentiment results to the database

        #Response 
        {
    "success": true,
    "analysis": [
        {
                "sentiment": "Positive",
                "score": 92
            },
            {
                "sentiment": "Positive",
                "score": 75
            },
            {
                "sentiment": "Neutral",
                "score": 65
            },
            {
                "sentiment": "Negative",
                "score": 25
            },
            {
                "sentiment": "Positive",
                "score": 85
            }
        ],
        "overall": {
            "sentiment": "Neutral",
            "score": 68.4
        },
        "summary": [
            "FastBite is a convenient and affordable option for a quick meal, praised for its friendly staff and fast service. While generally offering good food and a favorite spicy chicken sandwich, recent experiences have been inconsistent with issues like cold burgers and stale fries."
        ]
      }

      #Create Single Sentiment/Account
        #Description
        Accepts either a single text or multiple texts for sentiment analysis.
        Returns sentiment classification and scores for each text.
        Generates a summary for the input texts.
        Optionally saves results to a database when valid account credentials (account_id and account_key) are provided together.

        #Request Body
          You can send one of two types of JSON payloads:
             Single Text Input:
             - text (string, required): The text string to analyze.
             - account_id (string, optional): The account identifier. Must be provided together with account_key.
             - account_key (string, optional): The account key/password. Must be provided together with account_id.

             Multiple Texts Input:
             - texts (array of strings, required): An array of text strings to analyze.
             - account_id (string, optional): Must be provided together with account_key.
             - account_key (string, optional): Must be provided together with account_id.

        #Important Validation Rules
        - You must provide either the text field or the texts array — not both.
        - If you provide one of account_id or account_key, you must provide the other as well.
        - Both text and each element of texts must be non-empty strings.

        #Response
        {
          "success": true,
          "analysis": [
              {
                  "sentiment": "Positive",
                  "score": 92
              }
          ],
          "summary": [
              "The reviewer had a positive experience at FastBite, praising the quick and friendly service, delicious and juicy burgers, crispy fries, clean environment, and reasonable prices. They recommend it for a quick and tasty meal."
          ]
        }
        

      #Create Multiple Sentiment/Account
        #Description
        Accepts either a single text or multiple texts for sentiment analysis.
        Returns sentiment classification and scores for each text.
        Generates a summary for the input texts.
        Optionally saves results to a database when valid account credentials (account_id and account_key) are provided together.

        #Request Body
        You can send one of two types of JSON payloads:

          Single Text Input
          - text (string, required): The text string to analyze.
          - account_id (string, optional): The account identifier. Must be provided together with account_key.
          - account_key (string, optional): The account key/password. Must be provided together with account_id.

          Multiple Texts Input
          - texts (array of strings, required): An array of text strings to analyze.
          - account_id (string, optional): Must be provided together with account_key.
          - account_key (string, optional): Must be provided together with account_id.
        
        #Response 
        {
          "success": true,
          "analysis": [
              {
                  "sentiment": "Positive",
                  "score": 92
              },
              {
                  "sentiment": "Positive",
                  "score": 75
              },
              {
                  "sentiment": "Neutral",
                  "score": 65
              },
              {
                  "sentiment": "Negative",
                  "score": 25
              },
              {
                  "sentiment": "Positive",
                  "score": 85
              }
          ],
          "overall": {
              "sentiment": "Neutral",
              "score": 68.4
        },
        "summary": [
            "FastBite is a convenient and affordable option for a quick meal, praised for its friendly staff and fast service. While generally offering good food and a favorite spicy chicken sandwich, recent experiences have been inconsistent with issues like cold burgers and stale fries."
        ]
      }

    #Report
      #Generate Report
        #Dscriptipn
          This endpoint generates a sentiment analysis report based on the provided account credentials. It aggregates data for all sentiments linked to the specified account.
      #Request
      Method: POST
      Content-Type: application/json
      Request Body Parameters
      Parameter      Type    Required   Description                                      
      `account_id`  string    Yes       The unique identifier for the user account.    
      `account_key` string    Yes       The secret key or token associated with the user account for authentication. 

      #Response 
      {
        "success": true,
        "report": {
            "trend": "positive",
            "average_score": 68.4,
            "detailed_report": "Overall sentiment towards FastBite is positive, with several reviewers praising the friendly staff, quick service, and value for money. The spicy chicken sandwich received specific positive mention. However, there are recurring concerns about the quality of the fries, with some reviewers noting they were soggy or stale. One reviewer also reported a negative experience with a cold burger. While the majority of feedback is favorable, the consistency of food quality, particularly the fries and burger temperature, appears to be an area for improvement.",
            "recommendations": "Focus on improving the consistency of food quality, specifically addressing the issues with fries and burger temperature. Consider implementing quality control checks to ensure food is served fresh and at the correct temperature. Continue to highlight the positive aspects of FastBite, such as friendly staff and quick service, and consider promoting the spicy chicken sandwich."
      }
}



