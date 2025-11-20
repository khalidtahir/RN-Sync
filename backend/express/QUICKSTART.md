# Quick Start Guide - RN-Sync Backend

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL running (Docker or local)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Database

**Option A: Local Docker (Recommended)**
```bash
# Start PostgreSQL container
docker run --name rn-sync-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rn_sync \
  -p 5432:5432 \
  -d postgres:15-alpine
```

Update `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/rn_sync
```

**Option B: Supabase or AWS RDS**
- Update `.env` with your connection string

### Step 3: Initialize Database
```bash
npm run migrate
npm run seed
```

### Step 4: Start Server
```bash
npm start
```

✓ Server running on http://localhost:5000

## 🧪 Test Endpoints

### Using cURL

```bash
# Get all patients
curl http://localhost:5000/api/patients

# Create patient
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","bed":"ICU-1"}'

# Add reading
curl -X POST http://localhost:5000/api/patients/UUID/readings \
  -H "Content-Type: application/json" \
  -d '{"metric":"heart_rate","value":82,"unit":"bpm"}'
```

### Using Postman

1. Import: `RN-Sync-Backend.postman_collection.json`
2. Set `base_url` variable: `http://localhost:5000`
3. Run requests

### Using REST Client (VS Code)

Create `test.http`:
```http
### Get Patients
GET http://localhost:5000/api/patients

### Create Patient
POST http://localhost:5000/api/patients
Content-Type: application/json

{
  "name": "Jane Smith",
  "bed": "ICU-2"
}
```

## 📚 Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients |
| GET | `/api/patients/:id` | Get patient details |
| POST | `/api/patients` | Create new patient |
| GET | `/api/patients/:id/history` | Get patient readings history |
| POST | `/api/patients/:id/readings` | Add new reading |
| GET | `/api/patients/:id/files` | Get patient files |
| POST | `/api/patients/:id/files` | Upload file metadata |

## 🔗 Integration Points

### From Mobile App (React Native)
```javascript
// Get patient list for Dashboard
const response = await fetch('http://backend/api/patients');
const patients = await response.json();

// Get patient history
const history = await fetch(
  `http://backend/api/patients/${patientId}/history?metric=heart_rate`
);
```

### From WebSocket Server
```javascript
// Store vitals in database when received
const reading = await fetch(
  `http://backend/api/patients/${patientId}/readings`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: 'heart_rate',
      value: 82,
      unit: 'bpm'
    })
  }
);
```

## 📁 Project Structure

```
backend/
├── controllers/      # Business logic
├── routes/          # API endpoints
├── migrations/      # Database schema & seeds
├── utils/           # Helper functions
├── db.js            # Database connection
├── app.js           # Express setup
├── server.js        # Server entry point
└── README.md        # Full documentation
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check Docker container is running |
| Port 5000 in use | Change PORT in .env |
| Module not found | Run `npm install` |
| Database error | Run `npm run migrate` |

## 📖 Full Documentation

See `README.md` for:
- Complete API reference
- Authentication integration
- WebSocket setup
- File upload configuration
- Production deployment
- Testing procedures

## 🎯 Next Steps

1. ✅ Backend running
2. ⬜ Integrate with mobile frontend
3. ⬜ Connect WebSocket pipeline
4. ⬜ Add authentication
5. ⬜ Deploy to production

---

**Need help?** Check README.md or review the Postman collection
