# RN Sync Backend

This repository contains the serverless backend for the RN Sync platform, built with AWS Lambda, API Gateway, and Cognito.

## Project Structure

```
/
├── src/
│   ├── handlers/       # Lambda entry points (AWS-specific logic)
│   ├── services/       # Business logic (Testable, framework-agnostic)
│   └── utils/          # Shared utilities (Supabase client, etc.)
├── tests/              # Jest test suite and Simulator
├── docs/               # Documentation (API docs, Best Practices)
├── create_deployment_package.ps1 # Deployment script
└── package.json        # Dependencies and scripts
```

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Tests**:
    ```bash
    npm test
    ```

3.  **Run Simulator**:
    The simulator has been moved to the `tests/` directory. Run it using:
    ```bash
    npm run start:simulator
    ```
    *Or manually:* `node tests/simulator.js`

## Deployment

This project is deployed to AWS.
*   **WebSocket API**: `wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/`
*   **HTTP API**: `https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com`

## Documentation

*   [API Documentation](docs/API_DOCUMENTATION.md)
*   [Best Practices](docs/BEST_PRACTICES.md)