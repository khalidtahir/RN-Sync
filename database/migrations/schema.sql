-- Drop existing tables if they exist (for development/testing)
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS readings CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- PATIENTS table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bed TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- READINGS table (time-series vitals data)
CREATE TABLE readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FILES table (uploaded medical reports / logs)
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  storage_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_readings_patient_id ON readings(patient_id);
CREATE INDEX idx_readings_timestamp ON readings(timestamp);
CREATE INDEX idx_readings_patient_timestamp ON readings(patient_id, timestamp);
CREATE INDEX idx_files_patient_id ON files(patient_id);
