const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting Admin Messages Expiry Migration...');

    await client.query(`
      ALTER TABLE admin_messages 
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL;
    `);
    console.log('Column "expires_at" added.');

    await client.query(`
      ALTER TABLE admin_messages 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    console.log('Column "is_active" added.');

    console.log('Admin Messages Expiry Migration Completed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
