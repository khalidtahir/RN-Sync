# RN Sync - Engineering Best Practices

This document outlines the coding standards, testing strategies, and contribution guidelines for the RN Sync backend project. All contributors are expected to adhere to these standards to ensure code quality, maintainability, and professionalism.

## 1. Code Style & Professionalism

### General Guidelines
*   **Professional Tone**: Comments, documentation, and commit messages must be professional and concise. Avoid slang, humor, or excessive exclamation marks.
*   **No Emojis**: Do not use emojis in code comments, commit messages, or technical documentation.
*   **Naming Conventions**:
    *   Variables/Functions: `camelCase` (e.g., `fetchPatientData`)
    *   Files: `snake_case` or `kebab-case` (e.g., `websocket_handler.js`, `api-utils.js`)
    *   Classes: `PascalCase` (e.g., `CognitoClient`)
    *   Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)

### Documentation
*   **JSDoc**: Use JSDoc format for all public functions and complex logic.
    ```javascript
    /**
     * Validates the incoming sensor data payload.
     * @param {Object} payload - The data received from the device.
     * @returns {boolean} True if valid, false otherwise.
     */
    function validatePayload(payload) { ... }
    ```
*   **README**: Every major component should have a README explaining its purpose and usage.

## 2. Project Structure & Architecture

### Serverless Architecture
*   **Separation of Concerns**: Lambda handlers (`index.js`) should only handle the AWS-specific event parsing and response formatting. Business logic must be separated into dedicated modules (e.g., `services/`, `utils/`).
    *   *Why?* This allows business logic to be unit tested without mocking complex AWS event structures.
*   **Environment Variables**: Never hardcode secrets or configuration. Use `process.env` and ensure all required variables are documented.

### Directory Structure
```
/
├── src/
│   ├── handlers/       # AWS Lambda entry points
│   ├── services/       # Business logic (Supabase, Cognito)
│   └── utils/          # Shared utilities (validation, formatting)
├── tests/              # Jest test suite
├── docs/               # Documentation
└── package.json        # Dependencies and scripts
```

## 3. Testing Strategy

We use **Jest** for our testing framework.

### Unit Testing
*   **Coverage**: Aim for high test coverage (>80%) on business logic.
*   **Mocking**: Mock all external services (AWS SDK, Supabase, HTTP calls). Tests must run in isolation without network access.
*   **File Naming**: Test files should be named `*.test.js` and located alongside the file they test or in a `tests/` directory.

### Integration Testing
*   **Simulator**: Use the `simulator.js` script to verify end-to-end flows against the deployed environment.

## 4. Git Workflow

### Commit Messages
Use the [Conventional Commits](https://www.conventionalcommits.org/) specification.
*   `feat: add websocket auth handler`
*   `fix: correct token parsing logic`
*   `docs: update API documentation`
*   `refactor: separate business logic from handler`

### Pull Requests
*   PRs must pass all tests before merging.
*   Code review is required for all changes.

---
*Adherence to these guidelines ensures a robust and scalable system for the RN Sync platform.*
