const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const check = async () => {
  try {
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    const checkAnn = await db.query('SELECT * FROM announcements LIMIT 1').catch(e => ({ error: e.message }));
    console.log('Announcements table exists:', !checkAnn.error);

    const checkEvt = await db.query('SELECT * FROM events LIMIT 1').catch(e => ({ error: e.message }));
    console.log('Events table exists:', !checkEvt.error);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
