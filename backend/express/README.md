# RN-Sync Backend - Database + Patient Data Layer

This is the **Database and Patient Data Layer** backend for RN-Sync, a real-time iOS/React Native healthcare monitoring application. It provides REST API endpoints to manage patients, medical readings (vitals), and uploaded files.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Running the Backend](#running-the-backend)
- [API Endpoints](#api-endpoints)
- [Testing Endpoints](#testing-endpoints)
- [Integration with WebSocket](#integration-with-websocket)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

RN-Sync Backend is responsible for:

- **Patient Management**: Store and retrieve patient information (name, bed location, creation date)
- **Time-Series Vitals**: Store and query historical medical readings (heart rate, SpO2, temperature, blood pressure, etc.)
- **File Management**: Track uploaded medical reports and logs (PDFs, images, videos)
- **Real-Time Integration**: WebSocket connection pipeline for live vitals data (integrated with other backend lead's work)

## 🏗️ Architecture

```
RN-Sync Backend
├── PostgreSQL Database
│   ├── patients table
│   ├── readings table (time-series)
│   └── files table
├── Express.js REST API
│   ├── Patient endpoints
│   ├── Reading endpoints
│   ├── File endpoints
│   └── History queries
└── WebSocket Server (integrated from other backend lead)
```

## ✅ Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **PostgreSQL** (14+ recommended)
  - Local Docker instance, or
  - Supabase cloud, or
  - AWS RDS instance

## 📦 Installation

### 1. Clone the Repository

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `pg` - PostgreSQL client
- `dotenv` - Environment variable management
- `uuid` - UUID generation
- `nodemon` - Development server (optional)

## 🗄️ Database Setup

### Option 1: Local Docker PostgreSQL (Recommended for Development)

```bash
# Start a PostgreSQL container
docker run --name rn-sync-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=rn_sync \
  -p 5432:5432 \
  -d postgres:15-alpine

# Update .env:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/rn_sync
```

### Option 2: Supabase (Cloud)

1. Create a project at [supabase.com](https://supabase.com)
2. Get your connection string from Project Settings > Database
3. Update `.env`:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].supabase.co:5432/postgres
   ```

### Option 3: AWS RDS

1. Create an RDS instance at [AWS Console](https://aws.amazon.com/rds/)
2. Get your connection endpoint
3. Update `.env`:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[ENDPOINT].rds.amazonaws.com:5432/rn_sync
   ```

## ⚙️ Configuration

### 1. Set Up Environment Variables

Create a `.env` file in the `/backend` directory:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rn_sync

# Server
PORT=5000
NODE_ENV=development

# WebSocket (for integration)
WEBSOCKET_PORT=3000

# S3 Storage (optional for file uploads)
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# S3_BUCKET_NAME=your_bucket
```

### 2. Run Database Migrations

Create tables:

```bash
npm run migrate
```

This executes `migrations/schema.sql` and creates:
- `patients` table
- `readings` table
- `files` table
- Performance indexes

### 3. Seed Initial Data

Insert sample patients and readings:

```bash
npm run seed
```

This executes `migrations/seed.sql` and creates:
- 3 sample patients (John Doe, Jane Smith, Robert Johnson)
- Time-series readings for each patient
- Sample file references

## 🚀 Running the Backend

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will restart automatically on file changes.

### Production Mode

```bash
npm start
```

### Expected Output

```
========================================
✓ RN-Sync Backend Server Started
  Listening on http://localhost:5000
  Health Check: http://localhost:5000/health
========================================
```

## 🔌 API Endpoints

### Patient Endpoints

#### **GET /api/patients**
Get all patients with their latest vital signs.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid-1",
      "name": "John Doe",
      "bed": "ICU-1",
      "created_at": "2025-01-20T10:00:00.000Z",
      "latest_vital": 81,
      "latest_metric": "heart_rate"
    }
  ]
}
```

---

#### **GET /api/patients/:id**
Get patient by ID with latest readings for each metric.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "name": "John Doe",
    "bed": "ICU-1",
    "created_at": "2025-01-20T10:00:00.000Z",
    "latest_readings": [
      {
        "id": "uuid",
        "metric": "heart_rate",
        "value": 81,
        "unit": "bpm",
        "timestamp": "2025-01-20T10:05:00.000Z"
      },
      {
        "id": "uuid",
        "metric": "spo2",
        "value": 98,
        "unit": "%",
        "timestamp": "2025-01-20T10:05:00.000Z"
      }
    ]
  }
}
```

---

#### **POST /api/patients**
Create a new patient.

**Request Body:**
```json
{
  "name": "John Doe",
  "bed": "ICU-5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "id": "new-uuid",
    "name": "John Doe",
    "bed": "ICU-5",
    "created_at": "2025-01-20T10:00:00.000Z"
  }
}
```

---

### Reading Endpoints

#### **GET /api/patients/:id/history**
Get patient reading history with optional time range and metric filters.

**Query Parameters:**
- `from` - Start timestamp (ISO 8601)
- `to` - End timestamp (ISO 8601)
- `metric` - Filter by specific metric (e.g., `heart_rate`, `spo2`)

**Example:**
```
GET /api/patients/uuid-1/history?metric=heart_rate&from=2025-01-20T00:00:00Z&to=2025-01-20T23:59:59Z
```

**Response:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "id": "uuid",
      "patient_id": "uuid-1",
      "metric": "heart_rate",
      "value": 81,
      "unit": "bpm",
      "timestamp": "2025-01-20T10:05:00.000Z"
    }
  ]
}
```

---

#### **POST /api/patients/:id/readings**
Add a new reading for a patient (WebSocket integration point).

**Request Body:**
```json
{
  "metric": "heart_rate",
  "value": 82,
  "unit": "bpm"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reading added successfully",
  "data": {
    "id": "uuid",
    "patient_id": "uuid-1",
    "metric": "heart_rate",
    "value": 82,
    "unit": "bpm",
    "timestamp": "2025-01-20T10:05:00.000Z",
    "created_at": "2025-01-20T10:05:00.000Z"
  }
}
```

---

### File Endpoints

#### **GET /api/patients/:patientId/files**
Get all files for a patient.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "file_name": "ecg_report.pdf",
      "file_type": "pdf",
      "storage_url": "s3://bucket/ecg_report.pdf",
      "uploaded_at": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

---

#### **POST /api/patients/:patientId/files**
Add file metadata for a patient.

**Request Body:**
```json
{
  "file_name": "chest_xray.jpg",
  "file_type": "image/jpeg",
  "storage_url": "s3://bucket/chest_xray.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File added successfully",
  "data": {
    "id": "uuid",
    "patient_id": "uuid-1",
    "file_name": "chest_xray.jpg",
    "file_type": "image/jpeg",
    "storage_url": "s3://bucket/chest_xray.jpg",
    "uploaded_at": "2025-01-20T10:00:00.000Z"
  }
}
```

---

#### **GET /api/files/:fileId**
Get a specific file by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid-1",
    "file_name": "chest_xray.jpg",
    "file_type": "image/jpeg",
    "storage_url": "s3://bucket/chest_xray.jpg",
    "uploaded_at": "2025-01-20T10:00:00.000Z"
  }
}
```

---

#### **DELETE /api/files/:fileId**
Delete a file record.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": { ... }
}
```

---

### Health Check

#### **GET /health**
Check backend server status.

**Response:**
```json
{
  "status": "OK",
  "message": "RN-Sync Backend is running",
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

## 🧪 Testing Endpoints

### Using cURL

```bash
# Get all patients
curl http://localhost:5000/api/patients

# Get specific patient
curl http://localhost:5000/api/patients/{patient-id}

# Create new patient
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","bed":"ICU-6"}'

# Get patient history
curl "http://localhost:5000/api/patients/{patient-id}/history?metric=heart_rate"

# Add reading
curl -X POST http://localhost:5000/api/patients/{patient-id}/readings \
  -H "Content-Type: application/json" \
  -d '{"metric":"heart_rate","value":85,"unit":"bpm"}'
```

### Using Postman

1. **Import the collection:**
   - Create a new Postman collection
   - Add requests for each endpoint listed above
   - Set base URL: `http://localhost:5000`

2. **Example requests are provided in the endpoints section above**

### Using VS Code REST Client Extension

Create a file `test.http` in the backend folder:

```http
### Health Check
GET http://localhost:5000/health

### Get All Patients
GET http://localhost:5000/api/patients

### Get Patient by ID
GET http://localhost:5000/api/patients/uuid-here

### Create New Patient
POST http://localhost:5000/api/patients
Content-Type: application/json

{
  "name": "Jane Smith",
  "bed": "ICU-7"
}

### Get Patient History
GET http://localhost:5000/api/patients/uuid-here/history?metric=heart_rate

### Add Reading
POST http://localhost:5000/api/patients/uuid-here/readings
Content-Type: application/json

{
  "metric": "heart_rate",
  "value": 85,
  "unit": "bpm"
}
```

## 🔗 Integration with WebSocket

The other backend lead built the WebSocket server for real-time vitals. Here's how to integrate:

### WebSocket Data Flow → Database

When WebSocket receives data:

```json
{
  "patientId": "uuid-1",
  "heartRate": 82,
  "spo2": 97,
  "temperature": 37.2,
  "timestamp": "2025-01-20T10:05:00.000Z"
}
```

**Backend integration code example:**

```javascript
// In WebSocket handler
socket.on('vital-update', async (data) => {
  const { patientId, heartRate, spo2, temperature, timestamp } = data;
  
  // Insert into readings table
  await fetch(`http://localhost:5000/api/patients/${patientId}/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: 'heart_rate',
      value: heartRate,
      unit: 'bpm'
    })
  });
  
  await fetch(`http://localhost:5000/api/patients/${patientId}/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: 'spo2',
      value: spo2,
      unit: '%'
    })
  });
  
  // ... repeat for other metrics
});
```

## 📁 Project Structure

```
backend/
├── controllers/
│   ├── patientsController.js    # Patient CRUD logic
│   └── filesController.js       # File management logic
├── routes/
│   ├── patients.js              # Patient endpoints
│   └── files.js                 # File endpoints
├── migrations/
│   ├── schema.sql               # Database schema
│   ├── seed.sql                 # Sample data
│   ├── run.js                   # Run migrations
│   └── seed.js                  # Run seeds
├── app.js                       # Express app setup
├── db.js                        # Database connection
├── server.js                    # Server entry point
├── package.json                 # Dependencies
├── .env                         # Environment variables
└── README.md                    # This file
```

## 🔒 Security Considerations

For production deployment:

1. **Add authentication middleware:**
   ```javascript
   import { verifyToken } from './middleware/auth.js';
   router.use(verifyToken);
   ```

2. **Use environment variables:**
   - Never commit `.env` with real credentials
   - Use `.env.example` template

3. **Input validation:**
   ```javascript
   import { body, validationResult } from 'express-validator';
   router.post('/', [
     body('name').notEmpty(),
     body('bed').notEmpty()
   ], createPatient);
   ```

4. **SQL injection protection:**
   - All queries use parameterized statements (`$1, $2`)
   - Never concatenate user input into SQL

5. **Rate limiting:**
   ```javascript
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
   app.use(limiter);
   ```

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure database name exists

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Change PORT in .env
# Or kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### Module Not Found

```
Error: Cannot find module 'pg'
```

**Solution:**
```bash
npm install
```

### Migration/Seed Fails

**Solution:**
1. Check database connection
2. Ensure tables don't exist (run with clean DB)
3. Check SQL syntax in `migrations/schema.sql`

## 📚 Next Steps

1. **Setup complete** ✓
2. **Test endpoints** with Postman or cURL
3. **Integrate with frontend** (Dashboard, Patient pages, File upload)
4. **Connect WebSocket** data pipeline
5. **Add authentication** middleware from other backend lead
6. **Deploy to production** (Heroku, Railway, AWS)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API endpoint examples
3. Verify database connection
4. Check server logs

## 📝 License

MIT

---

**Built for RN-Sync Healthcare Monitoring**  
Real-time ICU vitals for iOS/React Native
