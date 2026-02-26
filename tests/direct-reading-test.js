/**
 * Direct test of reading insertion to diagnose the issue
 */

import { SupabaseClient } from '../src/utils/supabase-client.js';
import { randomUUID } from 'crypto';

// Use environment variables like Lambda does
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('=========================================');
console.log('Direct Reading Insertion Test');
console.log('=========================================\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.log('Set SUPABASE_URL and SUPABASE_KEY environment variables\n');
    process.exit(1);
}

console.log('✓ Credentials found');
console.log(`  URL: ${SUPABASE_URL}\n`);

const client = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);

async function testReadingInsertion() {
    try {
        // First, get an existing patient
        console.log('Step 1: Fetching existing patient...');
        const patients = await client.select('patients', { limit: 1 });
        
        if (!patients || patients.length === 0) {
            console.error('❌ No patients found in database');
            process.exit(1);
        }
        
        const patient = patients[0];
        console.log(`✓ Found patient: ${patient.name} (ID: ${patient.id})\n`);

        // Try to insert a reading
        console.log('Step 2: Inserting reading...');
        const newReading = {
            id: randomUUID(),
            patient_id: patient.id,
            metric: 'test_metric',
            value: 99,
            unit: 'test',
            timestamp: new Date().toISOString()
        };
        
        console.log('  Data to insert:', JSON.stringify(newReading, null, 2));
        
        await client.insert('readings', newReading);
        console.log('✓ Insert command completed (no error thrown)\n');

        // Verify the reading was actually saved
        console.log('Step 3: Verifying reading was saved...');
        const readings = await client.select('readings', {
            filters: { id: newReading.id },
            limit: 1
        });
        
        if (readings && readings.length > 0) {
            console.log('✓ Reading found in database!');
            console.log('  Retrieved:', JSON.stringify(readings[0], null, 2));
            console.log();
        } else {
            console.error('❌ Reading NOT found in database after insert!');
            console.log('This means the insert silently failed.\n');
        }

        // Check all readings for this patient
        console.log('Step 4: Checking all readings for patient...');
        const allReadings = await client.select('readings', {
            filters: { patient_id: patient.id },
            order: 'timestamp.desc',
            limit: 5
        });
        
        console.log(`✓ Total readings for ${patient.name}: ${allReadings.length}`);
        if (allReadings.length > 0) {
            allReadings.forEach((r, idx) => {
                console.log(`  ${idx + 1}. ${r.metric}: ${r.value} ${r.unit} at ${r.timestamp}`);
            });
        }
        console.log();

        console.log('=========================================');
        console.log('Test Complete');
        console.log('=========================================\n');

    } catch (error) {
        console.error('❌ Error during test:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testReadingInsertion();
