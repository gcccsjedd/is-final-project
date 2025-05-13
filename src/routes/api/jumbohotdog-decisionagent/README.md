### JumboHotdog Decision Agent API

JumboHotdog Decision Agent API is a helpful tool made for project managers who need to choose the right technologies for their software projects. Its main goal is to act like a tech advisor you just give it some basic information about your project, like the type of app you’re building, how many people are on your team, and what features you need. Based on that, the API suggests the best tools and technologies to use for the frontend, backend, hosting, and team collaboration.

You don’t need to be a tech expert to use it the API uses AI to give smart recommendations and explains why each choice fits your project. This makes planning easier, faster, and more reliable, so you can focus on managing the project while feeling confident about the technology your team will use.


## API Endpoint
- **URL**: `/api/jumbohotdog-decisionagent`
- **Method**: POST
- **Content-Type**: application/json

## Input Parameters
```json
{
    "name": "string",        // Project name
    "type": "string",        // Project type (e.g., "Web Application", "Mobile App")
    "teamSize": number,      // Number of team members (minimum: 1)
    "requirements": string[] // Array of project requirements (minimum: 1 item)
}
```

### Input Validation
The API uses JSON Schema validation to ensure all requests meet the required format. The schema enforces:
- All fields (`name`, `type`, `teamSize`, `requirements`) are required
- `teamSize` must be a positive number (minimum: 1)
- `requirements` must be a non-empty array of strings
- No additional properties are allowed

Validation errors will return a 400 Bad Request with details about the validation failure.

## Output Format
```json
{
    "project": {
        "name": "string",
        "type": "string",
        "teamSize": number,
        "requirements": string[]
    },
    "recommendedStack": {
        "frontend": {
            "framework": "string",
            "language": "string",
            "cssFramework": "string",
            "justification": "string"
        },
        "backend": {
            "language": "string",
            "framework": "string",
            "database": "string",
            "justification": "string"
        },
        "devOps": {
            "hosting": "string",
            "CI_CD": "string",
            "monitoring": "string",
            "justification": "string"
        },
        "tools": {
            "versionControl": "string",
            "projectManagement": "string",
            "communication": "string",
            "justification": "string"
        }
    }
}
```

## Example Request
```json
{
    "name": "E-commerce Platform",
    "type": "Web Application",
    "teamSize": 4,
    "requirements": [
        "User authentication",
        "Product catalog",
        "Shopping cart",
        "Payment integration",
        "Real-time inventory"
    ]
}
```

## Example Response
```json
{
    "project": {
        "name": "E-commerce Platform",
        "type": "Web Application",
        "teamSize": 4,
        "requirements": [
            "User authentication",
            "Product catalog",
            "Shopping cart",
            "Payment integration",
            "Real-time inventory"
        ]
    },
    "recommendedStack": {
        "frontend": {
            "framework": "React",
            "language": "TypeScript",
            "cssFramework": "Tailwind CSS",
            "justification": "React provides robust component-based architecture ideal for e-commerce UIs. TypeScript adds type safety, and Tailwind CSS offers rapid styling capabilities."
        },
        "backend": {
            "language": "Node.js",
            "framework": "Express.js",
            "database": "MongoDB",
            "justification": "Node.js with Express provides scalable backend services. MongoDB's flexible schema suits e-commerce product catalogs."
        },
        "devOps": {
            "hosting": "AWS",
            "CI_CD": "GitHub Actions",
            "monitoring": "New Relic",
            "justification": "AWS offers scalable cloud infrastructure. GitHub Actions for CI/CD, and New Relic for comprehensive monitoring."
        },
        "tools": {
            "versionControl": "Git",
            "projectManagement": "Jira",
            "communication": "Slack",
            "justification": "Git for version control, Jira for agile project management, and Slack for team communication."
        }
    }
}
```

### Error Handling
The API may return the following error responses:

## 1. **400 Bad Request**
   - Missing required fields
   - Invalid data types
   - Malformed JSON
   - Validation errors (e.g., teamSize < 1, empty requirements array)

## 2. **500 Internal Server Error**
   - OpenAI API connection issues
   - Invalid API key
   - Server processing errors

# Example error response:
```json
{
    "error": "Failed to process request",
    "details": "Error message details"
}
```

### Setup Requirements
1. OpenAI API key must be set in environment variables
   **Important**: Do not push your API key in github. Do not put the API key anywhere in the project, just put them in .env file, **you've been warned**.
   - Create an .env file at the root folder and put this:
   ```
   VITE_OPENAI_API_KEY=your_api_key_here
   ```

## 2. Required dependencies:
The project uses "Bun" as the package manager. Install the following dependencies.
# Core dependencies
    ```bash
    bun add openai # @^4.98.0 ver
    bun add @sveltejs/kit # @^2.16.0 ver
    bun add svelte # @^5.0.0
    bun add ajv # JSON Schema validator

    # TypeScript support
    bun add -d typescript@^5.0.0
    bun add -d bun-types@^1.2.12

    # Development dependencies (already included in package.json)
    bun add -d @sveltejs/adapter-auto@^6.0.0
    bun add -d @sveltejs/vite-plugin-svelte@^5.0.0
    bun add -d vite@^6.2.6
    bun add -d svelte-check@^4.0.0
    ```

## 3. Running the Project
```bash
# Development Server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Notes
- The project uses SvelteKit for the framework
- OpenAI API is used for generating recommendations
- TypeScript is used for type safety
- Bun is used as the package manager and runtime
- The API is designed for web and mobile application projects
- The code is modular and easy to update
- The API returns clear and structured Json responses

## Challenges and Learnings
# Learnings
- I tried jailbreaking the prompt, testing the system's limit.
User input embedded inside a fixed prompt template is hard to hijack
- Malicious text like "Ignore all instructions..." is treated as content, not commands.

System prompts strongly influence model behavior
- GPT-4o respects the assigned role ("tech stack advisor") and resists unrelated output.

Using response_format: { type: "json_object" } limits freedom
- This forces structured, predictable output, reducing risk of freeform responses like poems or recipes.

Jailbreaking is more effective when user controls the full prompt
- If users craft the entire prompt (messages: [...]), they can override system intent.

Models like GPT-4o are trained to ignore injection attempts inside content fields
- Even complex or clever instructions embedded in fields are usually ignored.

Weakening safety controls makes jailbreaking easier:
- Removing the system prompt
- Removing response_format
- Using older models like text-davinci-003

Attackers may try to inject JSON-looking structures (e.g., { "recipe": ... })
- But they’ll likely be ignored unless formatting enforcement is weak.

Validation on your end adds a final safety layer
- Even if a model misbehaves, strict output parsing can prevent misuse.

# Challenges 
- Implemented OpenAI integration for the first time. 
- Implemented proper API key management and security practices.
- Learned the importance of source control practices

