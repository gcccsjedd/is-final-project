# 🧠 Decision-Making AI Agent - Task Prioritization API

## 📌 Overview
The **Task Prioritization API** is designed to rank tasks based on urgency, deadlines, and importance. Using AI-powered reasoning, this system enhances decision-making efficiency.

## 🚀 Features
✅ Ranks tasks based on deadlines, urgency, and category  
✅ AI-assisted reasoning with **Ollama**  
✅ JSON-based input/output for easy integration  

## 🏗️ API Endpoint
### **POST /prioritize**
- **Request Format**
  ```json
  {
    "tasks": [
      { "description": "Complete final project", "deadline": "2025-05-10", "category": "work", "urgency": "high" },
      { "description": "Buy groceries", "deadline": "2025-05-08", "category": "personal", "urgency": "medium" }
    ]
  }
