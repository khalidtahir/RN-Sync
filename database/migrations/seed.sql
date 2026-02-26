-- Insert sample patients
INSERT INTO patients (name, bed) VALUES
    ('John Doe', 'ICU-1'),
    ('Jane Smith', 'ICU-2'),
    ('Robert Johnson', 'ICU-3');

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

-- Temperature readings for Jane Smith
INSERT INTO readings (patient_id, timestamp, metric, value, unit)
SELECT id, now() - INTERVAL '5 minutes', 'temperature', 37.1, '°C' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'temperature', 37.2, '°C' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'temperature', 37.0, '°C' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'temperature', 37.3, '°C' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'temperature', 37.1, '°C' FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, now(), 'temperature', 37.2, '°C' FROM patients WHERE name = 'Jane Smith';

-- Blood Pressure readings for Robert Johnson
INSERT INTO readings (patient_id, timestamp, metric, value, unit)
SELECT id, now() - INTERVAL '5 minutes', 'blood_pressure_systolic', 120, 'mmHg' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '4 minutes', 'blood_pressure_systolic', 122, 'mmHg' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '3 minutes', 'blood_pressure_systolic', 118, 'mmHg' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '2 minutes', 'blood_pressure_systolic', 121, 'mmHg' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now() - INTERVAL '1 minute', 'blood_pressure_systolic', 119, 'mmHg' FROM patients WHERE name = 'Robert Johnson'
UNION ALL
SELECT id, now(), 'blood_pressure_systolic', 120, 'mmHg' FROM patients WHERE name = 'Robert Johnson';

-- Insert sample files for patients
INSERT INTO files (patient_id, file_name, file_type, storage_url)
SELECT id, 'ecg_report_2025_01_20.pdf', 'application/pdf', 's3://rn-sync-files/ecg_report_2025_01_20.pdf'
FROM patients WHERE name = 'John Doe'
UNION ALL
SELECT id, 'chest_xray.jpg', 'image/jpeg', 's3://rn-sync-files/chest_xray.jpg'
FROM patients WHERE name = 'Jane Smith'
UNION ALL
SELECT id, 'blood_test_results.pdf', 'application/pdf', 's3://rn-sync-files/blood_test_results.pdf'
FROM patients WHERE name = 'Robert Johnson';
