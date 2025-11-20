import fs from 'fs';
import path from 'path';
import pool from '../db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    
    // Read and execute seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedScript = fs.readFileSync(seedPath, 'utf-8');
    
    await client.query(seedScript);
    console.log('✓ Database seeded successfully');
    
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
