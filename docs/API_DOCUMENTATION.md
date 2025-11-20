# RN Sync API Documentation

_Last updated: November 2025_

## Overview

The RN Sync backend delivers two interfaces:

- **HTTP API** (AWS API Gateway → `api-handler`) for patient, readings, and file CRUD.
- **WebSocket API** (`websocket-handler` + `ws-auth-handler`) for secure vital-stream ingestion.

### Base URLs

| Channel    | URL                                                            |
|------------|----------------------------------------------------------------|
| HTTP API   | `https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com`       |
| WebSocket  | `wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/`    |

All requests require a valid Cognito token unless otherwise noted.

---

## 1. Authentication

- **Region:** `us-east-2`
- **User Pool ID:** `us-east-2_OAZaH0Kk9`
- **App Client ID:** `2n2bqionolrsftg1k7umtlh2aa`

Obtain an ID/Access token via Cognito (`aws-amplify`, `amazon-cognito-identity-js`, or AWS SDK). Supply the token as:

- HTTP requests: `Authorization: Bearer <ID_TOKEN>`
- WebSocket connections: `wss://.../dev?token=<ACCESS_TOKEN>`

The WebSocket authorizer verifies the `token` query parameter on every connection.

---

## 2. WebSocket API (Real-Time Ingestion)

**Connect:** `wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/?token=<ACCESS_TOKEN>`

### Supported Routes

| Route        | Description                                      | Request Body                                                     |
|--------------|--------------------------------------------------|------------------------------------------------------------------|
| `$connect`   | Auth handshake (no body)                         | N/A                                                              |
| `$disconnect`| Cleanup (no body)                                | N/A                                                              |
| `ingest`     | Publish a vital reading for a patient            | JSON payload described below                                     |

#### `ingest` Payload

```json
{
  "patientId": "9d6e8c1c-7f9a-4af5-9d4d-e4c1c097d33e",
  "metric": "heart_rate",
  "value": 82,
  "unit": "bpm",
  "timestamp": "2025-11-20T15:04:05.000Z" // optional; server defaults to now()
}
```

Each message is inserted into the Supabase `readings` table and the handler echoes a success message. Extend the handler or downstream services to broadcast to connected clients as needed.

---

## 3. HTTP API (Patients, Readings, Files)

All endpoints live under the base URL above. Provide the Cognito ID token via `Authorization` header.

### 3.1 Health

`GET /health` → `200 OK`

```json
{ "message": "API is healthy" }
```

### 3.2 Patients

| Method & Path           | Description                        | Body / Query | Success Response |
|-------------------------|------------------------------------|--------------|------------------|
| `GET /patients`         | List patients (latest created first) | –          | `{ success, count, data: [...] }` |
| `POST /patients`        | Create patient                      | `{ "name": "Jane", "bed": "ICU-2" }` | `201 Created` with new patient |
| `GET /patients/{id}`    | Fetch patient + last 10 readings    | –            | `{ success, data: { patient fields, latest_readings: [] } }` |
| `GET /patients/{id}/history` | Fetch readings history      | Query params: `metric` optional | `{ success, count, data: [...] }` |
| `POST /patients/{id}/readings` | Create reading (HTTP)      | `{ "metric": "...", "value": 123, "unit": "bpm" }` | `201 Created` |

#### History Query Parameters

- `metric` – filter by metric name (e.g., `spo2`, `heart_rate`).

Example request:

```
GET /patients/9d6e8c1c/history?metric=spo2
Authorization: Bearer <token>
```

### 3.3 Files

| Method & Path                    | Description                               | Body / Notes |
|----------------------------------|-------------------------------------------|--------------|
| `GET /patients/{id}/files`       | List files for patient (newest first)     | – |
| `POST /patients/{id}/files`      | Add file metadata                         | `{ "file_name": "ecg.pdf", "storage_url": "s3://bucket/ecg.pdf", "file_type": "application/pdf" }` |
| `GET /files/{fileId}`            | Fetch single file metadata                | – |
| `DELETE /files/{fileId}`         | Delete metadata (currently returns 501 until Supabase delete support is added) | – |

---

## 4. Simulator & Testing

- `tests/simulator.js` demonstrates the Cognito login + WebSocket ingest flow.
- `npm run start:simulator` reads `aws-config.json` for credentials (keep this file out of source control in production).
- Jest suites in `tests/*.test.js` cover all handlers and services. Run via `npm test`.

---

## 5. Environment & Deployment Notes

- Lambdas require `SUPABASE_URL` and `SUPABASE_KEY`. Store them in AWS Lambda environment variables or Secrets Manager; do **not** commit keys to source control.
- CI/CD: `.github/workflows/deploy.yml` runs on `main` pushes, executes Jest, zips the repo (excluding docs/tests), and updates:
  - `api-handler`
  - `websocket-handler`
  - `ws-auth-handler`

Refer to `docs/SYSTEM_OVERVIEW.md` for a broader architectural description and future roadmap.
