-- Insert sample patients
INSERT INTO patients (name, bed) VALUES
  ('John Doe', 'ICU-1'),
  ('Jane Smith', 'ICU-2'),
  ('Robert Johnson', 'ICU-3');

-- Get patient IDs for reference (these will be different on each run)
-- Use the following pattern to insert readings for the patients created above

-- Insert sample readings for all patients
-- Heart Rate readings
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'heart_rate', 82, 'bpm' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'heart_rate', 85, 'bpm' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'heart_rate', 83, 'bpm' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'heart_rate', 84, 'bpm' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'heart_rate', 82, 'bpm' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now(), 'heart_rate', 81, 'bpm' FROM patients WHERE name = 'John Doe';

-- SpO2 readings for John Doe
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'spo2', 97, '%' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'spo2', 98, '%' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'spo2', 97, '%' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'spo2', 98, '%' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'spo2', 97, '%' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now(), 'spo2', 98, '%' FROM patients WHERE name = 'John Doe';

-- Temperature readings for John Doe
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'temperature', 37.2, '°C' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'temperature', 37.1, '°C' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'temperature', 37.2, '°C' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'temperature', 37.0, '°C' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'temperature', 37.1, '°C' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, now(), 'temperature', 37.2, '°C' FROM patients WHERE name = 'John Doe';

-- Heart Rate readings for Jane Smith
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'heart_rate', 76, 'bpm' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'heart_rate', 78, 'bpm' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'heart_rate', 77, 'bpm' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'heart_rate', 79, 'bpm' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'heart_rate', 76, 'bpm' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now(), 'heart_rate', 75, 'bpm' FROM patients WHERE name = 'Jane Smith';

-- SpO2 readings for Jane Smith
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'spo2', 95, '%' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'spo2', 96, '%' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'spo2', 95, '%' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'spo2', 96, '%' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'spo2', 95, '%' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now(), 'spo2', 96, '%' FROM patients WHERE name = 'Jane Smith';

-- Blood Pressure readings for Jane Smith
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'blood_pressure_systolic', 120, 'mmHg' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'blood_pressure_systolic', 121, 'mmHg' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'blood_pressure_systolic', 119, 'mmHg' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'blood_pressure_systolic', 122, 'mmHg' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'blood_pressure_systolic', 120, 'mmHg' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now(), 'blood_pressure_systolic', 119, 'mmHg' FROM patients WHERE name = 'Jane Smith';

-- Heart Rate readings for Robert Johnson
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'heart_rate', 88, 'bpm' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'heart_rate', 90, 'bpm' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'heart_rate', 89, 'bpm' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'heart_rate', 91, 'bpm' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'heart_rate', 88, 'bpm' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now(), 'heart_rate', 87, 'bpm' FROM patients WHERE name = 'Robert Johnson';

-- SpO2 readings for Robert Johnson
INSERT INTO readings (patient_id, timestamp, metric, value, unit) 
SELECT id, now() - INTERVAL '5 minutes', 'spo2', 94, '%' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'spo2', 95, '%' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'spo2', 94, '%' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'spo2', 95, '%' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'spo2', 94, '%' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now(), 'spo2', 95, '%' FROM patients WHERE name = 'Robert Johnson';

-- Insert sample files
INSERT INTO files (patient_id, file_name, file_type, storage_url) 
SELECT id, 'ecg_report_20250120.pdf', 'pdf', 's3://rn-sync-bucket/ecg_report_20250120.pdf' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, 'chest_xray_20250119.jpg', 'image/jpeg', 's3://rn-sync-bucket/chest_xray_20250119.jpg' FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, 'lab_results_20250120.pdf', 'pdf', 's3://rn-sync-bucket/lab_results_20250120.pdf' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, 'cardiac_ultrasound_20250118.mp4', 'video/mp4', 's3://rn-sync-bucket/cardiac_ultrasound_20250118.mp4' FROM patients WHERE name = 'Robert Johnson';
