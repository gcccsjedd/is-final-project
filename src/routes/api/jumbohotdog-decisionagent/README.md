Mag add pa kayo kung may kulang sa documentation -aron



### JumboHotdog Decision Agent API

A tech stack recommendation API that analyzes project requirements and suggests appropriate technologies.

## API Endpoint
- **URL**: `/api/jumbohotdog-decisionagent`
- **Method**: POST
- **Content-Type**: application/json

## Input Parameters
```json
{
    "name": "string",        // Project name
    "type": "string",        // Project type (e.g., "Web Application", "Mobile App")
    "teamSize": number,      // Number of team members
    "requirements": string[] // Array of project requirements
}
```

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
bun run dev

# Preview production build
bun run preview
```


## Notes
- The project uses SvelteKit for the framework
- OpenAI API is used for generating recommendations
- TypeScript is used for type safety
- Bun is used as the package manager and runtime
- The API is designed for web and mobile application projects


