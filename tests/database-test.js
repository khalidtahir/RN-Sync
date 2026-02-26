/**
 * Database connectivity and schema validation test
 * Tests connection to Supabase and verifies tables exist
 */

import { SupabaseClient } from '../src/utils/supabase-client.js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./aws-config.json', 'utf8'));

async function testDatabase() {
    console.log('=================================');
    console.log('RN Sync Database Connection Test');
    console.log('=================================\n');

    // Check for environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Missing Supabase credentials');
        console.log('Please set SUPABASE_URL and SUPABASE_KEY environment variables\n');
        process.exit(1);
    }

    console.log('✓ Supabase credentials found');
    console.log(`  URL: ${supabaseUrl}\n`);

    const client = new SupabaseClient(supabaseUrl, supabaseKey);

    // Test 1: Query patients table
    console.log('Test 1: Query patients table');
    try {
        const patients = await client.select('patients', { limit: 5 });
        console.log(`✓ Successfully queried patients table`);
        console.log(`  Found ${patients.length} patient(s)\n`);
        
        if (patients.length > 0) {
            console.log('  Sample patient:');
            console.log(`    ID: ${patients[0].id}`);
            console.log(`    Name: ${patients[0].name}`);
            console.log(`    Bed: ${patients[0].bed}\n`);
        }
    } catch (error) {
        console.error(`❌ Failed to query patients: ${error.message}\n`);
        process.exit(1);
    }

    // Test 2: Query readings table
    console.log('Test 2: Query readings table');
    try {
        const readings = await client.select('readings', { 
            order: 'timestamp.desc',
            limit: 5 
        });
        console.log(`✓ Successfully queried readings table`);
        console.log(`  Found ${readings.length} reading(s)\n`);
        
        if (readings.length > 0) {
            console.log('  Sample reading:');
            console.log(`    Metric: ${readings[0].metric}`);
            console.log(`    Value: ${readings[0].value} ${readings[0].unit}`);
            console.log(`    Timestamp: ${readings[0].timestamp}\n`);
        }
    } catch (error) {
        console.error(`❌ Failed to query readings: ${error.message}\n`);
        process.exit(1);
    }

    // Test 3: Query files table
    console.log('Test 3: Query files table');
    try {
        const files = await client.select('files', { limit: 5 });
        console.log(`✓ Successfully queried files table`);
        console.log(`  Found ${files.length} file(s)\n`);
        
        if (files.length > 0) {
            console.log('  Sample file:');
            console.log(`    Name: ${files[0].file_name}`);
            console.log(`    Type: ${files[0].file_type}`);
            console.log(`    URL: ${files[0].storage_url}\n`);
        }
    } catch (error) {
        console.error(`❌ Failed to query files: ${error.message}\n`);
        process.exit(1);
    }

    // Test 4: Schema validation - check all required columns exist
    console.log('Test 4: Schema validation');
    try {
        const patients = await client.select('patients', { limit: 1 });
        if (patients.length > 0) {
            const patient = patients[0];
            const requiredFields = ['id', 'name', 'bed', 'created_at'];
            const missingFields = requiredFields.filter(field => !(field in patient));
            
            if (missingFields.length > 0) {
                console.error(`❌ Patients table missing fields: ${missingFields.join(', ')}\n`);
                process.exit(1);
            }
            console.log('✓ Patients table schema validated\n');
        }

        const readings = await client.select('readings', { limit: 1 });
        if (readings.length > 0) {
            const reading = readings[0];
            const requiredFields = ['id', 'patient_id', 'timestamp', 'metric', 'value', 'unit'];
            const missingFields = requiredFields.filter(field => !(field in reading));
            
            if (missingFields.length > 0) {
                console.error(`❌ Readings table missing fields: ${missingFields.join(', ')}\n`);
                process.exit(1);
            }
            console.log('✓ Readings table schema validated\n');
        }
    } catch (error) {
        console.error(`❌ Schema validation failed: ${error.message}\n`);
        process.exit(1);
    }

    console.log('=================================');
    console.log('✓ All database tests passed!');
    console.log('=================================\n');
}

testDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
