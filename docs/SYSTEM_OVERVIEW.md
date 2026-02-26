# RN Sync Backend – System Overview

This document captures the current state of the serverless backend in this repository and highlights the most important next steps.

## 1. Runtime Architecture

- **Lambdas:** `api-handler`, `websocket-handler`, `ws-auth-handler` (Node.js 22.x). Each handler has a dedicated entry file in `src/handlers/`.
- **Services:** Business logic lives in `src/services/` and all persistence is routed through the lightweight Supabase wrapper in `src/utils/supabase-client.js`.
- **Tests:** Comprehensive Jest suites under `tests/` cover services, handlers, and the simulator.
- **Simulator:** `tests/simulator.js` authenticates via Cognito and streams vitals over the production WebSocket endpoint.

## 2. Configuration & Deployment

- Required environment variables per Lambda:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
- GitHub Actions workflow `.github/workflows/deploy.yml` runs tests, zips the repo, and updates all three Lambda functions. 
- Local development:
  1. `npm install`
  2. `npm test`
  3. `npm run start:simulator` (requires valid `aws-config.json` credentials)

## 3. API Surface

- **REST:** `api-handler` exposes `/health`, `/patients`, `/patients/{id}`, `/patients/{id}/history`, `/patients/{id}/readings`, `/patients/{id}/files`, `/files/{id}`. Routing is implemented manually inside the handler.
- **WebSocket:** `websocket-handler` supports `$connect`, `$disconnect`, and `ingest` routes. Each `ingest` message becomes a `readings` row.
- **Auth:** `ws-auth-handler` validates Cognito tokens supplied via `token` query parameter and issues IAM policies for API Gateway to enforce.

Detailed payloads and examples remain in `docs/API_DOCUMENTATION.md`.



