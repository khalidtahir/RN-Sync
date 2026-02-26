# RN Sync - Testing Checklist

## ✅ Automated Tests (Completed)

- [x] **Jest Test Suite** - All 41 tests passing
  - api-service.test.js ✓
  - websocket-service.test.js ✓
  - file-service.test.js ✓
  - patient-service.test.js ✓
  - auth-service.test.js ✓
  - api-handler.test.js ✓
  - websocket-handler.test.js ✓
  - auth-handler.test.js ✓

## 📋 Manual Testing Required

### 1. Database Connectivity Test

**Prerequisites:**
- Get SUPABASE_URL from Supabase dashboard
- Get SUPABASE_KEY (service_role key) from Supabase dashboard

**Commands:**
```powershell
# Set credentials (temporary)
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_KEY = "your-service-role-key"

# Run database test
node tests/database-test.js
```

**Expected Output:**
```
=================================
RN Sync Database Connection Test
=================================

✓ Supabase credentials found
✓ Successfully queried patients table
  Found X patient(s)
✓ Successfully queried readings table
  Found X reading(s)
✓ Successfully queried files table
  Found X file(s)
✓ Patients table schema validated
✓ Readings table schema validated

=================================
✓ All database tests passed!
=================================
```

### 2. End-to-End Simulator Test

**Command:**
```bash
npm run start:simulator
```

**Expected Output:**
```
Authenticating with Cognito...
Access Token: eyJraWQiOiJ...
Connecting to WebSocket...
WebSocket connected successfully
Streaming vitals...
✓ Sent heart rate reading
✓ Sent SpO2 reading
```

**What It Tests:**
- Cognito authentication flow
- WebSocket connection with token authorization
- Real-time data ingestion
- Production endpoint connectivity

### 3. Production API Endpoints

**Test Health Endpoint:**
```powershell
curl https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com/health
```

**Expected:** `{"message":"API is healthy"}`

**Test Patient List:**
```powershell
# Get Cognito token first (use simulator or Cognito SDK)
curl https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com/patients `
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

**Expected:** JSON with patient list

### 4. Frontend Application

**Start Development:**
```bash
cd frontend
npm install
npm start
```

**Test Login:**
1. Open Expo app on device/simulator
2. Login with credentials:
   - Email: patient0@rnsync.com
   - Password: 123456.Ab
3. Verify redirect to profile/dashboard

**Test Patient Dashboard:**
1. Navigate to patients view
2. Verify patient list loads from Lambda API
3. Click on patient to view details
4. Verify readings display correctly

## 🔒 Security Verification

### AWS Cognito
- [x] User Pool exists (us-east-2_OAZaH0Kk9)
- [x] App Client configured (2n2bqionolrsftg1k7umtlh2aa)
- [ ] Test user exists (patient0@rnsync.com)
- [ ] Password complexity enforced

### API Authorization
- [x] WebSocket requires token in query params
- [x] HTTP endpoints require Bearer token
- [x] Auth handler validates JWT signatures
- [x] TLS 1.3 encryption via API Gateway

## 📊 Performance Targets

- [ ] API latency < 500ms (p95)
- [ ] WebSocket connection < 1s
- [ ] Patient list query < 300ms
- [ ] Historical data query < 500ms

## 🐛 Known Issues / Warnings

1. **baseline-browser-mapping outdated** - Update with `npm i baseline-browser-mapping@latest -D`
2. **VM Modules experimental** - Expected warning, can ignore
3. **npm version** - Consider updating to 11.x (optional)

## ✅ Deployment Verification

### GitHub Actions
- [x] Workflow file exists (.github/workflows/deploy.yml)
- [x] Tests run before deployment
- [x] Deploys all 3 Lambda functions
- [ ] AWS credentials configured in GitHub Secrets

### Lambda Functions
- [ ] Verify SUPABASE_URL set in api-handler
- [ ] Verify SUPABASE_KEY set in api-handler
- [ ] Verify SUPABASE_URL set in websocket-handler
- [ ] Verify SUPABASE_KEY set in websocket-handler
- [ ] Check CloudWatch logs for errors

## 📈 Metrics to Monitor

1. **Lambda Invocations** - CloudWatch metrics
2. **Error Rates** - CloudWatch logs
3. **API Gateway Latency** - API Gateway metrics
4. **Database Query Performance** - Supabase dashboard
5. **WebSocket Connections** - Connection count and duration

---

**Status:** Project is ready for final testing and deployment verification.
