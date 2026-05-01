const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Adding notification preferences to users table...');

    // 1. Add notifications_enabled
    const checkEnabled = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='notifications_enabled'
    `);
    
    if (checkEnabled.rows.length === 0) {
      await db.query(`ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE;`);
      console.log('Added notifications_enabled column.');
    }

    // 2. Add muted_until if not exists (should exist from earlier, but just in case)
    const checkMuted = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='muted_until'
    `);
    
    if (checkMuted.rows.length === 0) {
      await db.query(`ALTER TABLE users ADD COLUMN muted_until TIMESTAMP;`);
      console.log('Added muted_until column.');
    }

    console.log('Notification preferences migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
