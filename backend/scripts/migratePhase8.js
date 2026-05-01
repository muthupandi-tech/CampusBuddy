const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Starting Phase 8 migration: My Class module...');

    // 1. Create sections table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(10) NOT NULL,
        department VARCHAR(50) NOT NULL,
        year VARCHAR(10) NOT NULL,
        staff_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, department, year)
      );
    `);

    // 2. Update users table with section_id
    const checkUserCol = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='section_id'
    `);
    
    if (checkUserCol.rows.length === 0) {
      await db.query(`ALTER TABLE users ADD COLUMN section_id INT REFERENCES sections(id);`);
    }

    // 3. Create section_messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS section_messages (
        id SERIAL PRIMARY KEY,
        section_id INT REFERENCES sections(id),
        sender_id UUID REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create internal_marks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS internal_marks (
        id SERIAL PRIMARY KEY,
        student_id UUID REFERENCES users(id),
        subject_id INT REFERENCES subjects(id),
        internal1 INT DEFAULT 0,
        internal2 INT DEFAULT 0,
        assignment INT DEFAULT 0,
        total INT GENERATED ALWAYS AS (internal1 + internal2 + assignment) STORED,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Update timetable table to include section_id
    const checkTTCol = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='timetable' AND column_name='section_id'
    `);
    
    if (checkTTCol.rows.length === 0) {
      await db.query(`ALTER TABLE timetable ADD COLUMN section_id INT REFERENCES sections(id);`);
    }

    console.log('Phase 8 migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
