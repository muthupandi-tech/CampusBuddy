const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const updateTables = async () => {
  try {
    console.log('Updating direct_messages table...');
    await db.query(`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;`);
    console.log('Table updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error updating tables:', err);
    process.exit(1);
  }
};

updateTables();
