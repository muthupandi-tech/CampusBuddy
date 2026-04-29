const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const createTables = async () => {
  try {
    console.log('Creating tables...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id SERIAL PRIMARY KEY,
        sender_id UUID REFERENCES users(id),
        receiver_id UUID REFERENCES users(id),
        message TEXT,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS classroom_blocks (
        id SERIAL PRIMARY KEY,
        classroom_id INT REFERENCES classrooms(id),
        blocked_user_id UUID REFERENCES users(id),
        blocked_by UUID REFERENCES users(id)
      );
    `);
    
    console.log('Tables created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
};

createTables();
