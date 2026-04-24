const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting Preferences Migration...');

    // Add muted_until to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP DEFAULT NULL;
    `);
    console.log('Column "muted_until" added to users table.');

    // Ensure feedback table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "feedback" checked/created.');

    console.log('Preferences Migration Completed Successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
