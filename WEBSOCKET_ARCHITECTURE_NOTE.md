# WebSocket Architecture - Important Note

## Current WebSocket Design

The RN Sync WebSocket implementation is **unidirectional** (client → server):

### ✅ What WebSocket Does:
- **Client sends** vital signs to server in real-time
- **Server receives** and saves to database
- Server processes data and returns status to API Gateway

### ❌ What WebSocket Does NOT Do:
- Server does **not** send messages back to clients
- Server does **not** broadcast to other connected clients
- Clients do **not** receive real-time updates via WebSocket

## Why This Design?

This is a **data ingestion pipeline**, not a chat/notification system.

**Use Case:**
- Patient monitors stream vitals → Backend saves to database
- Clinicians view data → Frontend fetches via HTTP API

## For Jack: How to Display Data

**Don't expect WebSocket responses!** Instead:

### Option 1: Polling (Simple)
```javascript
// Fetch latest readings every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com/patients/${id}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    const data = await response.json();
    // Update chart with data.latest_readings
  }, 2000);
  
  return () => clearInterval(interval);
}, [id]);
```

### Option 2: Initial Load + Local Updates (Better UX)
```javascript
// 1. Load initial data from API
useEffect(() => {
  fetchPatientData(id); // HTTP call
}, [id]);

// 2. Update local chart when YOU send data via WebSocket
ws.onopen = () => {
  setInterval(() => {
    const data = generateHeartRateData();
    const message = { ... };
    ws.send(JSON.stringify(message));
    
    // Update local state immediately (optimistic update)
    setChartData(prev => [...prev, data.bpm]);
  }, 1000);
};
```

## If You Need Bidirectional WebSocket

To send messages FROM server TO clients, you need to:

### 1. Store Connection IDs
When client connects, save connectionId to database:
```javascript
// In handleConnect()
await supabase.insert('connections', {
  connection_id: connectionId,
  patient_id: patientId,
  connected_at: new Date()
});
```

### 2. Use API Gateway Management API
```javascript
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const client = new ApiGatewayManagementApiClient({
  endpoint: "https://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev"
});

await client.send(new PostToConnectionCommand({
  ConnectionId: connectionId,
  Data: JSON.stringify({ message: "Hello from server!" })
}));
```

### 3. Update IAM Permissions
Lambda needs `execute-api:ManageConnections` permission.

## Recommendation

**For this project, keep the current architecture:**
- WebSocket for real-time **ingestion** (device → server)
- HTTP API for data **retrieval** (frontend → server)
- Use polling or optimistic updates for UI

This is simpler, cheaper, and sufficient for the capstone project requirements.

## Summary for Jack

✅ **"Forbidden" error is FIXED** - Connection works now!  
✅ **Data is being sent** successfully  
✅ **Backend is processing** and saving data  
⚠️ **Server responses** - Not implemented (by design)  
→ **Use HTTP API** to fetch and display data instead

Pull the latest code from main and test again!
