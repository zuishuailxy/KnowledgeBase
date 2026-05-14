# Copilot Instructions for KnowledgeBase

This repository is a collection of frontend and backend knowledge, demos, and learning projects. It is organized by technology stack rather than being a single cohesive application.

## High-Level Architecture

*   **Structure**: The repository is a "monorepo" in the sense of containing multiple projects, but they are largely independent.
    *   `React/`, `Vue/`, `Node/`, `Next/`: Contain standalone projects and demos for respective technologies.
    *   `micro-app/monorepo`: A specific sub-project using **pnpm workspaces**.
    *   `Python/`: Contains Python scripts and likely a virtual environment.
    *   `full-stack/`: Projects spanning frontend and backend.
*   **Dependency Management**:
    *   Most projects use `npm` or `yarn` individually.
    *   `micro-app/monorepo` uses `pnpm`.
    *   `Python` projects use `requirements.txt` and virtual environments.

## Build, Test, and Lint Commands

There is no root-level build or test command. You must operate within specific subdirectories.

### Node.js / Frontend Projects
1.  **Navigate** to the specific project directory (e.g., `cd React/react-demo`).
2.  **Check Scripts**: Read `package.json` to find available scripts.
    *   Commonly: `npm install`, `npm run dev` (or `start`), `npm run build`.
3.  **Monorepo (`micro-app/monorepo`)**:
    *   Use `pnpm install` in the `micro-app/monorepo` directory.
    *   Run commands via `pnpm` (e.g., `pnpm --filter <package> run <command>`).

### Python Projects
1.  **Navigate** to `Python/` or its subdirectories.
2.  **Environment**: Look for a `.venv` directory. If present, activate it:
    *   Windows: `.venv\Scripts\activate`
    *   Linux/Mac: `source .venv/bin/activate`
3.  **Dependencies**: `pip install -r requirements.txt`.

### Testing
*   Most projects **do not** have configured tests (default `echo "Error: no test specified"` is common).
*   If tests exist, they will be in `package.json` under `"test"`.

## Key Conventions

*   **Context Specificity**: When answering questions or generating code, **always identify the technology of the current subdirectory** (e.g., don't suggest React solutions if the user is in `Vue/`).
*   **No Global Standards**: There are no root-level linter (`.eslintrc`) or formatter (`.prettierrc`) configurations.
    *   **Adhere to local style**: Mimic the coding style of the specific project you are working in.
    *   If no style is obvious, use standard/modern conventions for the language (e.g., functional components for React, ES6+ for JS).
*   **Educational Nature**: Much of the code is for demonstration ("demos"). Prioritize **clarity and readability** over complex optimizations, unless the specific project (like `micro-app`) appears to be an advanced implementation.

## Data Authenticity Checks

For any answer, report, or agent output that relies on data, especially stock, portfolio, financial, market, valuation, news, sentiment, or macro data:

*   First reflect on whether the data source is real and suitable for the conclusion.
*   State the source channel, retrieval or citation time, reporting period or trading day, metric definition, and whether the source is primary or a third-party aggregator.
*   Prefer primary sources such as company announcements, exchange filings, annual reports, and quarterly reports for decisive claims; use public quote or data APIs as supporting sources.
*   If sources conflict, freshness is unclear, or cross-checking is not possible, lower confidence, mark the data as needing verification, and list the missing source needed before making a stronger conclusion.
*   Never fabricate real-time prices, financial periods, dividend plans, news sentiment, market state, or quantitative scores to make an answer look complete.

## A-Share Market and Trading Unit Rules

For stock analysis, reports, portfolio reviews, or holding actions, default to the A-share market unless the user explicitly names another market. Any buy, add, reduce, take-profit, or exit recommendation must be expressed in 100-share board lots. Do not recommend 10, 20, 50, or other odd-lot share amounts as standalone trades; if available cash is below one lot, say to wait or take no action.
