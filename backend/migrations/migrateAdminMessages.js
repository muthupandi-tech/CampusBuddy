const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting Admin Messages Migration...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_messages (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        target_role VARCHAR(20) NOT NULL DEFAULT 'all',
        department VARCHAR(50),
        is_priority BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "admin_messages" created successfully.');

    console.log('Admin Messages Migration Completed Successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
