# Team LastNerve NLP API

A content examination service API that utilizes Ollama with language models for textual analysis.

## Overview

This API provides natural language processing capabilities for analyzing news articles and other text content. It leverages local language models through Ollama to perform various analyses including subject identification, perspective assessment, reliability evaluation, and bias detection.

## Prerequisites

- Ollama service running on `localhost:11434`
- At least one compatible language model installed (preferably `deepseek-r1-7b1.5b`)

## API Endpoints
A. POST ENDPOINT
* Handles content analysis requests
* Validates incoming requests
* Processes the content through the LLM
* Returns structured analysis with metadata
* Includes error handling for various failure scenarios

B. GET ENDPOINT
* Provides service status information
* Reports on:
  - Service operational status
  - Available models
  - Whether the preferred model is being used
  - Version information
  - Supported features


#1# GET `/api/team-lastnerve-nlp`

Returns the current status of the NLP service.

#### Response

```json
{
    "service": "Content Analysis API",
    "status": "operational",
    "message": "Content Analysis API is available but using a fallback model.",
    "system_ready": true,
    "active_model": "deepseek-r1:1.5b",
    "preferred_model": "deepseek-r1-1.5b",
    "using_preferred": false,
    "version": "2.1.0",
    "supported_features": [
        "news_analysis",
        "bias_detection",
        "credibility_assessment"
    ]
}
```

#2# POST `/api/team-lastnerve-nlp`

Analyzes provided text content and returns structured analysis.

#### Request Body

```json
{
  "content": "String containing the text to analyze (50-12000 characters)",
  "comprehensive": true | false (optional, defaults to false)
}
```

#### Response (Success)

```json
{
  "status": "success",
  "analysis": {
    "primary_subject": "Core topic of the content",
    "perspective": "objective | subjective | other descriptor",
    "key_assertions": ["List of main claims (comprehensive only)"],
    "bias_indicators": ["Phrases suggesting bias (comprehensive only)"],
    "reliability_index": 0.85, // Number from 0.0 to 1.0
    "executive_summary": "Summary of the content"
  },
  "metadata": {
    "model": "Model name used for analysis",
    "content_length": 1234,
    "timestamp": "ISO timestamp",
    "analysis_type": "comprehensive | standard"
  }
}
```

#### Response (Error)

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Error description"
}
```

##TEST 1
** POST `/api/team-lastnerve-nlp` 

```json
**REQUEST BODY
{
  "content": "President Donald Trump told reporters that when it comes to peace talks between Russia and Ukraine, \"nothing is going to happen until\" he meets with Russian President Vladimir Putin. \"Nothing's gonna happen until Putin and I get together, ok? And obviously — he wasn't going to go. He was going to go, but he thought I was going. He wasn't going if I wasn't there and I don't believe anything's going to happen, whether you like it or not, until he and I get together. But we're going to have to get it solved because too many people are dying,\" Trump told reporters on Air Force One as he landed in Abu Dhabi, United Arab Emirates. Trump added that he was not disappointed that the Russian delegation sent to Turkey Thursday for high-level talks with Ukraine did not include Putin: \"I'm not disappointed in anything.\" He continued, \"I'm not disappointed. Why would I be? We just took in $4 trillion, and you're disappointed about a delegation? I know nothing about a delegation, I haven't even checked.\" Ukrainian President Volodymyr Zelensky has said he won't meet with any Russian representatives in Turkey besides Putin. He called the delegation who showed up Thursday \"phony.\"",
  "comprehensive": true
}
```

**RESPONSE
```json
{
    "status": "success",
    "analysis": {
        "@ Trump: tell reporters that when it comes to peace talks between Russia and Ukraine, nothing is going to happen until [he] meets with Russian President Vladimir Putin.": [],
        " 31562905487101882943.338528339829433, ": " - "
    },
    "metadata": {
        "model": "deepseek-r1:1.5b",
        "content_length": 1181,
        "timestamp": "2025-05-20T23:23:06.192Z",
        "analysis_type": "comprehensive"
    }
}
```
## Test 2
POST
```json
{
  "content": "In the gripping game of thrones of Philippine politics, voters have delivered former Philippine President Rodrigo Duterte a sweeping mayoral victory in his hometown stronghold of Davao – predictable for a family that has held the job for more than 20 years.\n\nBut this latest landslide win creates a predicament for the Philippines, as the mayor-elect is thousands of miles away behind bars awaiting trial on charges of crimes against humanity.\n\nProsecutors at the International Criminal Court (ICC) in The Hague accuse the 80-year-old political patriarch of carrying out a brutal war on drugs that killed possibly thousands of people, including many innocents and bystanders. Though he openly boasted about the crackdown, Duterte has long denied accusations of human rights abuses and has repeatedly said he will not kowtow to a foreign court.\n\nHis next hearing is in September, but before then experts say he faces a new, complicated legal battle between the ICC and Philippine jurisdiction over whether he will be allowed to take the oath of office.\n\nDuterte can potentially be sworn in by proxy or in absentia – possibly by a video call, but only if The Hague-based court allows it, experts say.\n\nIf he’s allowed to assume the role, questions will be asked about how he could administer the southern city from a detention center in another time zone, where he has access to a computer and phone calls to family, but no internet.\n\nUnder Philippine law, day-to-day duties could fall to his youngest son, Sebastian Duterte, who was elected as vice mayor of Davao City.\n\nIf the senior Duterte isn’t allowed to take the oath, experts say the role of mayor could fall to election runner-up Karlo Nograles, of the Nograles political dynasty, longtime Duterte rivals in Davao, where both families tussle for influence.\n\nRamon Beleno, a political analyst and former professor from Ateneo de Davao University, said handing the job to Nograles could trigger a separate legal challenge from the Dutertes.\n\nDuterte remains a powerful yet divisive figure in the Philippines. In Davao City, where he served as mayor for over two decades before becoming president in 2016, fervent supporters credit his iron grip over the city with bolstering law and order.\n\nDuterte’s lawyer, Nicholas Kaufman, was quoted by Philippine news outlet ABS-CBN as saying the “overwhelming” support for Duterte in the 2025 midterm elections showed the public’s “total rejection” of the national government’s “attempt to stamp out” the former president’s legacy.\n\nIn a reply to CNN, Kaufman said “any swearing in ceremony would be dictated by and conform to the law of the Republic of the Philippines. Accordingly, a decision on this issue will be taken in the very near future after all options have been discussed with the former President’s Filipino lawyers.”\n\nIs he allowed to be mayor?\nThe main legal hurdle Duterte faces, despite his landslide mayoral win, is whether he would be allowed to swear the oath during his enforced absence.\n\nAll elected public officials are supposed to take their oath within 30 days of their supposed assumption of office on July 1, according to Joel Butuyan, an ICC-accredited lawyer and president of human rights NGO CenterLaw.\n\nUnable to be sworn in at home, Duterte would need to take the oath in the presence of a Philippine ambassador or consul in The Hague, which seems unlikely, Butuyan said.\n\n“I don’t think he’s going to be allowed to get out just to take office because it’s not in the enumerated rights of an accused (person) in the ICC,” he said.",
  "comprehensive": true
}




Error codes include:
- `VALIDATION_FAILED`: Invalid request data
- `PROCESSING_FAILED`: Error during content analysis
- `INVALID_REQUEST`: Malformed request
- `MALFORMED_RESPONSE`: Invalid response from language model

## Content Constraints

- Minimum length: 50 characters
- Maximum length: 12,000 characters

## Analysis Types

- **Standard**: Basic analysis with primary subject, perspective, reliability index, and a brief summary
- **Comprehensive**: Detailed analysis that additionally includes key assertions and bias indicators

## Fallback Behavior

The API will attempt to use the preferred `deepseek-r1-1.5b` model. If unavailable, it will fall back to other compatible models in this order:
1. `newsanalyst-custom`
2. `deepseek-coder:7b-instruct-q4_0`
3. `deepseek:latest`
4. `mistral:latest`
5. `llama3:latest`
6. Any model containing keywords: deepseek, mistral, llama, neural
