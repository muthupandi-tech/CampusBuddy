const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Starting Phase 10 migration: Department management & Admin restrictions...');

    // 1. Create departments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
    `);

    // 2. Update users table with admin_department
    const checkUserCol = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='admin_department'
    `);
    
    if (checkUserCol.rows.length === 0) {
      await db.query(`ALTER TABLE users ADD COLUMN admin_department VARCHAR(50);`);
    }

    // 3. Seed departments
    const initialDepts = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI-DS'];
    for (const dept of initialDepts) {
      await db.query('INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [dept]);
    }

    // 4. Update existing admin users to have a default department if needed
    // For testing/MVP purposes, assign them to 'CSE' if they don't have one
    await db.query(`UPDATE users SET admin_department = 'CSE' WHERE role = 'admin' AND admin_department IS NULL;`);

    console.log('Phase 10 migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
