/**
 * Check all readings in the database
 */

import { SupabaseClient } from '../src/utils/supabase-client.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const client = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);

console.log('=========================================');
console.log('Database Readings Check');
console.log('=========================================\n');

async function checkReadings() {
    try {
        // Get all patients first
        console.log('Patients in database:');
        const patients = await client.select('patients', {});
        patients.forEach((p, idx) => {
            console.log(`  ${idx + 1}. ${p.name} (${p.bed}) - ID: ${p.id}`);
        });
        console.log(`\nTotal: ${patients.length} patients\n`);

        // Get ALL readings
        console.log('All readings in database:');
        const allReadings = await client.select('readings', { 
            order: 'created_at.desc',
            limit: 50
        });
        
        if (allReadings.length === 0) {
            console.log('❌ NO READINGS FOUND!\n');
            console.log('Possible causes:');
            console.log('  1. Readings were never actually saved');
            console.log('  2. Supabase table permissions issue');
            console.log('  3. Wrong table name\n');
        } else {
            console.log(`✓ Found ${allReadings.length} readings\n`);
            
            // Group by patient
            const byPatient = {};
            allReadings.forEach(r => {
                if (!byPatient[r.patient_id]) {
                    byPatient[r.patient_id] = [];
                }
                byPatient[r.patient_id].push(r);
            });

            console.log('Readings by patient:');
            Object.entries(byPatient).forEach(([patientId, readings]) => {
                const patient = patients.find(p => p.id === patientId);
                const patientName = patient ? patient.name : 'Unknown';
                console.log(`\n  ${patientName} (${patientId}):`);
                console.log(`    Total readings: ${readings.length}`);
                readings.slice(0, 3).forEach((r, idx) => {
                    console.log(`    ${idx + 1}. ${r.metric}: ${r.value} ${r.unit} at ${r.timestamp}`);
                });
                if (readings.length > 3) {
                    console.log(`    ... and ${readings.length - 3} more`);
                }
            });
        }

        console.log('\n=========================================');
        console.log('✓ Database Check Complete');
        console.log('=========================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

checkReadings();
