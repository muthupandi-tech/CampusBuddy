const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const check = async () => {
  try {
    const annCols = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'announcements'
    `);
    console.log('Announcements Columns:', annCols.rows.map(r => r.column_name));

    const evtCols = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);
    console.log('Events Columns:', evtCols.rows.map(r => r.column_name));

    const resCols = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resources'
    `);
    console.log('Resources Columns:', resCols.rows.map(r => r.column_name));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
