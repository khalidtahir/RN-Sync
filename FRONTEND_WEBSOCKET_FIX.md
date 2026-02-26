# WebSocket Fix for Frontend Team

**For:** Jack Fergusson  
**Issue:** WebSocket "Forbidden" error  
**Status:** ✅ Fixed

## What Was Wrong

### Problem 1: Token Not Available ❌
The WebSocket was connecting **before** the token was available from login.

```javascript
// OLD CODE - BROKEN
useEffect(() => {
  const secureUrl = `${WS_URL}?token=${token}`; // token might be null!
  const ws = new WebSocket(secureUrl);
  ...
}, []); // No dependency on token!
```

### Problem 2: Wrong Message Format ❌
The message sent to WebSocket didn't match what the backend expects.

```javascript
// OLD - WRONG FORMAT
{
  action: "ingest",
  deviceId: 1,
  payload: data
}

// NEW - CORRECT FORMAT
{
  action: "ingest",
  patientId: id,
  metric: "heart_rate",
  value: data.bpm,
  unit: "bpm",
  timestamp: new Date().toISOString()
}
```

### Problem 3: No Cleanup ❌
WebSocket and intervals weren't being cleaned up when component unmounted.

## ✅ What Was Fixed

All fixes have been applied to `frontend/app/(dashboard)/patients/[id].jsx`:

1. **Added token check**
```javascript
if (!token) {
  console.log("Waiting for authentication token...");
  return;
}
```

2. **Added token dependency**
```javascript
}, [token]); // WebSocket reconnects when token becomes available
```

3. **Fixed message format**
```javascript
const message = {
  action: "ingest",
  patientId: id,
  metric: "heart_rate",
  value: data.bpm,
  unit: "bpm",
  timestamp: new Date().toISOString()
};
```

4. **Added cleanup**
```javascript
return () => {
  if (ws.intervalId) clearInterval(ws.intervalId);
  if (ws.readyState === WebSocket.OPEN) ws.close();
};
```

## How to Test

### Step 1: Pull Latest Changes
```bash
git pull origin main
```

### Step 2: Run the Frontend
```bash
cd frontend
npm install
npm start
```

### Step 3: Test Flow
1. **Login** with: patient0@rnsync.com / 123456.Ab
2. **Navigate** to any patient detail page
3. **Check console** for:
   - "Waiting for authentication token..." (if token not ready)
   - "Token available, length: 219" (when token is ready)
   - "Connecting to WebSocket..."
   - "Connected! Starting data stream..."
   - "Sent: {action: 'ingest', patientId: '...', ...}"

### Step 4: Verify in AWS CloudWatch

**Check these logs:**

**Log Group:** `/aws/lambda/ws-auth-handler`
```
✓ Should show: "User verified: patient0@rnsync.com"
❌ Should NOT show: "No token provided" or "Token verification failed"
```

**Log Group:** `/aws/lambda/websocket-handler`
```
✓ Should show: "Received event: ingest from [connectionId]"
✓ Should show: Ingested Data: {...}
```

## Still Getting "Forbidden"?

If you still get "Forbidden" after these fixes, check:

### 1. Cognito App Client Configuration
**AWS Console → Cognito → User Pools → us-east-2_OAZaH0Kk9**
- Go to: App Integration → App Clients → 2n2bqionolrsftg1k7umtlh2aa
- Verify: "ALLOW_USER_PASSWORD_AUTH" is checked

### 2. Auth Handler Permissions
**AWS Console → Lambda → ws-auth-handler → Configuration → Permissions**
- Check the execution role has `cognito-idp:GetUser` permission
- Role should allow access to user pool: us-east-2_OAZaH0Kk9

### 3. Token Expiration
Tokens expire after 1 hour. If testing for a long time:
- Log out and log back in to get fresh token
- Consider adding token refresh logic

## Expected Behavior

**When Working Correctly:**

1. User logs in → Gets Access Token
2. Navigate to patient page → WebSocket waits for token
3. Token available → WebSocket connects with `?token=...`
4. Auth handler validates token → Returns "Allow" policy
5. Connection established → "Connected! Starting data stream..."
6. Data streams every 1 second → Backend saves to Supabase
7. Backend responds → "Data saved for patient: [id]"

## Additional Resources

- See: `docs/WEBSOCKET_TROUBLESHOOTING.md` for detailed debugging
- See: `docs/API_DOCUMENTATION.md` for WebSocket API specs
- See: `tests/simulator.js` for working WebSocket example

## Questions?

Ask Ziyad - the backend is working perfectly in production via the simulator. The issue was frontend-specific token handling.
