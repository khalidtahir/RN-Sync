# RN Sync API Documentation

## Overview
This document outlines the backend API for **RN Sync**, including Authentication, Real-time WebSockets, and REST endpoints.

### Base URLs
- **WebSocket API**: `wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/`
- **HTTP API**: `https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com`

---

## 1. Authentication (Cognito)
All APIs are secured using AWS Cognito. You must obtain an **ID Token** (or Access Token, depending on the endpoint) to connect.

- **User Pool ID**: `us-east-2_OAZaH0Kk9`
- **App Client ID**: `2n2bqionolrsftg1k7umtlh2aa`
- **Region**: `us-east-2`

### How to Login (Frontend)
Use `aws-amplify` or `amazon-cognito-identity-js` to sign in.
```javascript
import { Auth } from 'aws-amplify';
const user = await Auth.signIn(username, password);
const token = user.signInUserSession.idToken.jwtToken;
```

---

## 2. WebSocket API (Real-time Data)
Used by Laptops to stream data and iOS Apps to receive updates.

**Endpoint**: `wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/`

### Connection
You **MUST** pass the auth token in the query string.
```
wss://...?token=YOUR_ACCESS_TOKEN
```

### Events
#### `ingest` (Laptop -> Cloud)
Send sensor data to the cloud.
```json
{
  "action": "ingest",
  "deviceId": "laptop-01",
  "payload": {
    "type": "ECG",
    "bpm": 72,
    "timestamp": "2023-10-27T10:00:00Z"
  }
}
```

#### Broadcast (Cloud -> iOS)
(Currently echoes back for testing).
```json
{
  "type": "ECG",
  "bpm": 72
}
```

---

## 3. HTTP API (History)
Used by the iOS App to fetch historical data.

**Endpoint**: `GET /history`

### Headers
Requires the **Authorization** header with a valid ID Token.
```
Authorization: Bearer YOUR_ID_TOKEN
```

### Parameters
- `deviceId` (optional): Filter by device.
- `limit` (optional): Number of records (default 50).

### Response
```json
[
  {
    "id": 1,
    "device_id": "laptop-01",
    "data": { "bpm": 72 },
    "created_at": "..."
  }
]
```

---

## 4. Environment Variables (Lambda)
Ensure these are set in AWS Lambda Configuration for both `websocket-handler` and `api-handler`:
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_KEY`: Your Supabase Service Role Key.
- `TABLE_NAME`: `sensor_readings` (or your table name).
