# Theoretical General AI Approach - Final Project

## Project Overview
This project involves collaborating in a GitHub repository using the Svelte, Bun, and Ollama tech stack to develop an AI agent that simulates aspects of a theoretical General AI approach. Teams will design and implement a functional API that integrates with the repository.

## Learning Objectives
By completing this project, you will:
- Work collaboratively in a Git-based development workflow (branching, pull requests, merging)
- Design and implement an AI-driven API that processes inputs and returns meaningful outputs
- Document API usage, including expected inputs, outputs, and error handling
- Simulate an AI agent within a larger AI system

## Project Requirements

### 1. Team Formation
- Form a team of 3 members
- Assign roles (API developer, documentation lead, Git workflow manager)

### 2. AI Agent Development
Develop one functional API that integrates with the provided repository. Choose one of the following agent types:
- Natural Language Processing (NLP) (e.g., text summarization, sentiment analysis)
- Image Generation (e.g., Stable Diffusion via Ollama)
- Image Processing (e.g., object detection, filters)
- Decision-Making Agent (e.g., rule-based or LLM-driven reasoning)

### 3. Documentation
Include a README.md in your branch with:
- API endpoint and expected HTTP method (GET/POST)
- Input parameters (JSON/query params/form data)
- Output format (JSON, image, text)
- Example request/response
- Error handling (possible failure cases) or troubleshooting guide.

### 4. Folder Structure & Naming Convention
- All API-related files must be placed under `src/routes/api`.
- Name your folder in the format: `src/routes/api/[team-name]-[ai-agent]` (e.g. `src/routes/api/team-alpha-imagegen`)
- The folder must contain the following:
  - API implementation files.
  - A README.md documenting the API.
  - The JSON Schema for input validation.

### 5. Git Workflow
- Branch out from main and develop your feature in a new branch
- Submit a Pull Request (PR) for review before merging
- No direct commits to main - all changes must go through PRs
- **Add the instructor (@gcccsjedd) as a reviewer** to your Pull Request.

### 6. Demo & Presentation
- Demo Dates: May 14–23, 2025
- Prepare a 5-minute live demo showcasing:
  - API functionality (input/output demonstration)
  - Explanation of your AI agent's design
  - Challenges faced & lessons learned

## Submission Guidelines
1. Clone the provided repository and set up your team's workspace
2. Create a branch named `feature/[team-name]-[ai-agent]` (e.g., `feature/team-alpha-imagegen`)
3. Submit a Pull Request (PR) by May 14, 2025 (11:59 PM) with:
   - Working API code
   - Documentation (README + JSON Schema)
   - A list of contributions per member
   - Add **@gcccsjedd** as a reviewer to your Pull Request before submission.

## Grading Criteria
1. Functional API
2. Git Collaboration
3. Documentation & Schema
4. Demo & Presentation
5. Code Quality & Readability

## Important Notes
- No submission = Incomplete grade in Finals
- Late submissions will incur a 10% deduction per day
- Plagiarism or using pre-built APIs without modification will result in zero marks
- Failure to add @gcccsjedd as a reviewer to your PR will result in a 10% penalty.

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
