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
- GitHub Actions workflow `.github/workflows/deploy.yml` runs tests, zips the repo, and updates all three Lambda functions. The workflow excludes legacy assets (`backend/*`, docs, tests) from the deployment artifact.
- Local development:
  1. `npm install`
  2. `npm test`
  3. `npm run start:simulator` (requires valid `aws-config.json` credentials)

## 3. API Surface

- **REST:** `api-handler` exposes `/health`, `/patients`, `/patients/{id}`, `/patients/{id}/history`, `/patients/{id}/readings`, `/patients/{id}/files`, `/files/{id}`. Routing is implemented manually inside the handler.
- **WebSocket:** `websocket-handler` supports `$connect`, `$disconnect`, and `ingest` routes. Each `ingest` message becomes a `readings` row.
- **Auth:** `ws-auth-handler` validates Cognito tokens supplied via `token` query parameter and issues IAM policies for API Gateway to enforce.

Detailed payloads and examples remain in `docs/API_DOCUMENTATION.md`.

## 4. Future Enhancements

The platform is functional, but the following upgrades will provide a more production-ready experience:

1. **Configuration Hardening**
   - Replace the raw `aws-config.json` with environment-specific config and secret storage (SSM / Secrets Manager).
   - Add a typed env loader (zod/joi) to catch missing variables at cold-start.

2. **Observability**
   - Introduce structured logging (pino) and correlation IDs.
   - Ship metrics and alerts via CloudWatch Alarms for Lambda error spikes.

3. **Data Access Layer**
   - Expand `SupabaseClient` with update/delete methods and richer filtering.
   - Extract repositories/interfaces to decouple handlers from Supabase-specific logic.

4. **Routing & Validation**
   - Adopt a lightweight router or request builder to reduce manual regex checks in `api-handler`.
   - Add schema validation for patient/file/readings payloads and return consistent error objects.

5. **CI / Delivery**
   - Add linting/formatting to the workflow.
   - Cache dependencies between jobs to speed up test + deploy stages.

6. **Simulator & Tooling**
   - Parameterize simulator intervals and metrics.
   - Provide Postman/VS Code REST collections that point to the live API Gateway endpoints.

Keeping this document current ensures new contributors understand both the deployed footprint and the roadmap.

