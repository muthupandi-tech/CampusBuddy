const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Adding subject_id to classroom_resources...');

    const checkCol = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='classroom_resources' AND column_name='subject_id'
    `);
    
    if (checkCol.rows.length === 0) {
      await db.query(`ALTER TABLE classroom_resources ADD COLUMN subject_id INT REFERENCES subjects(id);`);
    }

    console.log('Migration b completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
