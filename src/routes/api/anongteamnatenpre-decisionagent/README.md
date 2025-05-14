🧠 Decision-Making AI Agent - Task Prioritization API
📌 Overview
The Task Prioritization API intelligently ranks tasks based on urgency, deadlines, and importance using AI-assisted reasoning via DeepSeek-R1 7B. This ensures better task management and decision-making efficiency.

🚀 Features
✅ AI-powered task ranking based on urgency, category, and deadlines ✅ Uses Ollama for intelligent prioritization reasoning ✅ JSON-based API for seamless integration ✅ Validates task structure to prevent incorrect inputs

🏗️ API Endpoint
POST /api/anongteamnatenpre-decisionagent
Method: POST

Content-Type: application/json

Description: Accepts a list of tasks, prioritizes them, and returns AI-generated analysis.

🔹 Request Format

{
    "tasks": [
        {
            "description": "Fix API route issue",
            "deadline": "2025-05-16",
            "category": "development",
            "urgency": "high"
        },
        {
            "description": "Optimize database queries",
            "deadline": "2025-05-18",
            "category": "performance",
            "urgency": "medium"
        },
        {
            "description": "Write unit tests for authentication",
            "deadline": "2025-05-22",
            "category": "testing",
            "urgency": "low"
        }
    ]
}
📤 Response Format
{
    "prioritized_tasks": [
        {
            "description": "Fix API route issue",
            "deadline": "2025-05-16",
            "category": "development",
            "urgency": "high",
            "priority": "High"
        },
        {
            "description": "Optimize database queries",
            "deadline": "2025-05-18",
            "category": "performance",
            "urgency": "medium",
            "priority": "Medium"
        },
        {
            "description": "Write unit tests for authentication",
            "deadline": "2025-05-22",
            "category": "testing",
            "urgency": "low",
            "priority": "Low"
        }
    ],
    "ollama_analysis": "Based on the provided tasks, here is a structured ranking considering urgency, importance, deadlines, and dependencies:\n\n1. **Fix API Route Issue**  \n   - **Deadline:** May 16th (2 days away)  \n   - **Category:** Development  \n   - **Urgency:** High  \n   - **Priority:** High  \n   - **Reasoning:** This task is time-sensitive with a tight deadline, making it critical. Fixing API routes could be foundational for subsequent tasks like query optimization and testing.\n\n2. **Optimize Database Queries**  \n   - **Deadline:** May 18th (3 days away)  \n   - **Category:** Performance  \n   - **Urgency:** Medium  \n   - **Priority:** Medium  \n   - **Reasoning:** While important, this task is slightly less urgent than the API fix. However, it should ideally be addressed before proceeding with testing to ensure accurate results.\n\n3. **Write Unit Tests for Authentication**  \n   - **Deadline:** May 22nd (approximately a week away)  \n   - **Category:** Testing  \n   - **Urgency:** Low  \n   - **Priority:** Low  \n   - **Reasoning:** This task has the farthest deadline and lowest urgency. However, it is essential for assessing system security and catching potential issues.\n\n**Suggested Improvements:**\n- Prioritize completing the API fix before moving on to query optimization to ensure accurate results.\n- Start writing unit tests for authentication as soon as possible to address any immediate concerns about security.\n\nThis ranking and reasoning provide a clear path to managing tasks efficiently, ensuring critical work is addressed promptly while addressing less urgent but still necessary tasks."
}
🔎 Error Handling
Possible Errors & Fixes
Error	Cause	Solution
400 Bad Request	Invalid JSON format	Ensure request body is properly formatted JSON
400 Bad Request	Missing required fields	Include description, deadline, category, and urgency for each task
500 Internal Server Error	AI model fetch failed	Verify that the Ollama server is running (ollama serve)
404 Not Found	Incorrect endpoint	Ensure the request is sent to /api/anongteamnatenpre-decisionagent

📁 Folder Structure
src/routes/api/anongteamnatenpre-decisionagent/
├── +server.ts   # API Implementation
├── validate.ts  # Validation Logic
├── sortTask.ts  # Sorting Logic
├── constant.ts  # Priority Levels
├── README.md    # API Documentation
├── schema.json  # JSON Schema for input validation