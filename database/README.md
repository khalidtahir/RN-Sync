# Database Schema

**Author:** Khalid Tahir  
**Original Commit:** ad33165 (Nov 20, 2025)

## Overview

This directory contains the database schema designed by Khalid Tahir for the RN Sync platform. The schema is deployed on Supabase (PostgreSQL) and is used by the serverless Lambda backend for all data operations.

## Schema Structure

The database consists of three primary tables:

### `patients` Table
Stores patient demographic and location information.
- `id` (UUID, Primary Key)
- `name` (TEXT, NOT NULL)
- `bed` (TEXT, NOT NULL) - ICU bed assignment
- `created_at` (TIMESTAMPTZ)

### `readings` Table
Time-series storage for vital sign measurements.
- `id` (UUID, Primary Key)
- `patient_id` (UUID, Foreign Key → patients)
- `timestamp` (TIMESTAMPTZ, NOT NULL)
- `metric` (TEXT, NOT NULL) - e.g., heart_rate, spo2, temperature
- `value` (NUMERIC, NOT NULL)
- `unit` (TEXT) - e.g., bpm, %, °C
- `created_at` (TIMESTAMPTZ)

### `files` Table
Metadata for uploaded medical documents and images.
- `id` (UUID, Primary Key)
- `patient_id` (UUID, Foreign Key → patients)
- `file_name` (TEXT, NOT NULL)
- `file_type` (TEXT)
- `storage_url` (TEXT, NOT NULL) - S3 or cloud storage URL
- `uploaded_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

## Indexes

Performance indexes on the `readings` table:
- `idx_readings_patient_id` - Query by patient
- `idx_readings_timestamp` - Query by time range
- `idx_readings_patient_timestamp` - Composite for patient + time queries
- `idx_files_patient_id` - Query files by patient

## Usage

The schema is already deployed on Supabase. The serverless Lambda functions access these tables via the Supabase REST API. For local development or database recreation, run:

```sql
-- Create tables
psql -d your_database < migrations/schema.sql

-- Insert sample data
psql -d your_database < migrations/seed.sql
```

## Integration with Serverless Backend

The Lambda functions in `src/services/` interact with these tables through the Supabase client wrapper:
- `patient-service.js` - CRUD operations on `patients` table
- `websocket-service.js` - Inserts into `readings` table
- `file-service.js` - Manages `files` table

All queries use Khalid's original table structure and maintain referential integrity through foreign key constraints.
