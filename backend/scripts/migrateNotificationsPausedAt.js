const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Adding notifications_paused_at to users table...');

    const checkCol = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='notifications_paused_at'
    `);
    
    if (checkCol.rows.length === 0) {
      await db.query(`ALTER TABLE users ADD COLUMN notifications_paused_at TIMESTAMP;`);
      console.log('Added notifications_paused_at column.');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
