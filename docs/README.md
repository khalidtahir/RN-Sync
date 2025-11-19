# RN Sync Backend

This repository contains the serverless backend for the RN Sync platform, built with AWS Lambda, API Gateway, and Cognito.

## Project Structure

```
/
├── src/
│   ├── handlers/       # Lambda entry points (AWS-specific logic)
│   ├── services/       # Business logic (Testable, framework-agnostic)
│   └── utils/          # Shared utilities (Supabase client, etc.)
├── tests/              # Jest test suite
├── docs/               # Documentation (API docs, Best Practices)
├── simulator.js        # Data simulator for testing
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
    ```bash
    npm run start:simulator
    ```

## Deployment

This project is deployed to AWS.
*   **WebSocket API**: `wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/`
*   **HTTP API**: `https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com`

## Documentation

*   [API Documentation](API_DOCUMENTATION.md)
*   [Best Practices](BEST_PRACTICES.md)
