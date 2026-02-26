# WebSocket Connection Troubleshooting

## Issue: "Forbidden" Error on WebSocket Connection

**Error Message:**
```json
{"message": "Forbidden", "connectionId":"ZWh4vfMoiYcAcjg=", "requestId":"ZWh40FPkiYcESnw="}
```

This error comes from AWS API Gateway when the authorizer Lambda denies the connection.

## Root Causes & Solutions

### 1. Token Not Passed or NULL (MOST COMMON)

**Problem:** The token is `null` or `undefined` when WebSocket tries to connect.

**Solution:** ✅ Fixed in `frontend/app/(dashboard)/patients/[id].jsx`
- Added check: `if (!token) return;`
- Added dependency: `useEffect(..., [token])`
- WebSocket now waits for token before connecting

**Test:**
```javascript
// Check console logs
console.log("Token available, length:", token.length); // Should show number
```

### 2. Wrong Token Type

**Problem:** Using ID Token instead of Access Token (or vice versa)

**Current Setup:** ✅ Correctly using **Access Token**
```javascript
// UserContext.jsx line 47
setToken(response.AuthenticationResult.AccessToken);
```

**Auth Handler Expects:** Access Token for `GetUserCommand`
```javascript
// auth-service.js line 10
const command = new GetUserCommand({ AccessToken: token });
```

### 3. Token Expired

**Problem:** Cognito tokens expire after 1 hour by default

**Solution:** Add token refresh logic or re-authenticate

**Quick Test:**
```javascript
// Log in again to get fresh token
// Then try WebSocket connection
```

### 4. Cognito App Client Configuration

**Problem:** USER_PASSWORD_AUTH not enabled on App Client

**Check in AWS Console:**
1. Go to Cognito → User Pools → us-east-2_OAZaH0Kk9
2. App Integration → App Clients → 2n2bqionolrsftg1k7umtlh2aa
3. Verify "ALLOW_USER_PASSWORD_AUTH" is enabled

### 5. Auth Handler Lambda Configuration

**Problem:** Lambda doesn't have correct region or permissions

**Check in AWS Console:**
1. Go to Lambda → ws-auth-handler
2. Configuration → Environment Variables
3. Verify region is set (if needed)
4. Check execution role has Cognito permissions

**Required IAM Permissions:**
```json
{
  "Effect": "Allow",
  "Action": [
    "cognito-idp:GetUser"
  ],
  "Resource": "arn:aws:cognito-idp:us-east-2:*:userpool/us-east-2_OAZaH0Kk9"
}
```

## Message Format Issues (Also Fixed)

### Original (WRONG):
```javascript
{
  action: "ingest",
  deviceId: 1,
  payload: data
}
```

### Corrected (RIGHT):
```javascript
{
  action: "ingest",
  patientId: id,
  metric: "heart_rate",
  value: data.bpm,
  unit: "bpm",
  timestamp: new Date().toISOString()
}
```

## Testing Steps

### 1. Verify Token is Available
```javascript
// Add to frontend console
console.log("Token:", token?.substring(0, 20) + "...");
console.log("Token length:", token?.length);
```

### 2. Test WebSocket URL Format
```javascript
// Should be:
wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/?token=eyJraWQi...
```

### 3. Check CloudWatch Logs
Go to AWS CloudWatch → Log Groups:
- `/aws/lambda/ws-auth-handler` - Shows auth attempts and failures
- `/aws/lambda/websocket-handler` - Shows connection and message handling

**Look for:**
- "Token verification failed" → Token is invalid/expired
- "No token provided" → Token not in query string
- "User verified: xxx" → Auth successful

### 4. Manual WebSocket Test

Use a WebSocket testing tool (Postman, websocat, or browser console):

```javascript
// In browser console after logging in
const token = "YOUR_ACCESS_TOKEN";
const ws = new WebSocket(`wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/?token=${token}`);

ws.onopen = () => console.log("Connected!");
ws.onerror = (e) => console.error("Error:", e);
ws.onmessage = (m) => console.log("Message:", m.data);
```

## Quick Fixes Applied

✅ Added token null check before WebSocket connection  
✅ Added token to useEffect dependency array  
✅ Fixed message format to match backend expectations  
✅ Added proper cleanup for WebSocket and intervals  
✅ Added console logging for debugging  

## Next Steps for Jack

1. **Pull latest changes** from main branch (includes fixes)
2. **Test login** - Verify token is set in UserContext
3. **Navigate to patient detail** - Check console for "Token available" log
4. **Check CloudWatch logs** - See what auth-handler is logging
5. **Verify App Client config** - Ensure USER_PASSWORD_AUTH enabled

If still getting "Forbidden" after these fixes, the issue is likely:
- Cognito App Client configuration
- Auth handler Lambda IAM permissions
- Token expiration

## Additional Debug Logging

Add this to UserContext.jsx after login:
```javascript
console.log("Login successful!");
console.log("Access Token length:", response.AuthenticationResult.AccessToken?.length);
console.log("ID Token length:", response.AuthenticationResult.IdToken?.length);
```

This confirms tokens are being received properly.
