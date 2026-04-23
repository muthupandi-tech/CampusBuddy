const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    console.log('Running Phase 4 Academic Setup Migration...');

    // 1. Resources Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150),
        file_url TEXT,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Announcements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150),
        description TEXT,
        posted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Events Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150),
        description TEXT,
        event_date DATE,
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Timetable
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timetable (
        id SERIAL PRIMARY KEY,
        department VARCHAR(50),
        year INT,
        day VARCHAR(20),
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        time_slot VARCHAR(50)
      );
    `);

    console.log('Tables initialized. Seeding initial timetable...');

    // Optional Seed data since there's no UI for creating it
    // First figure out if there are any CSE / ECE subjects for Year 2 mapping to insert.
    const res = await pool.query('SELECT COUNT(*) FROM timetable');
    if (parseInt(res.rows[0].count) === 0) {
       await pool.query(`
          INSERT INTO timetable (department, year, day, subject_id, time_slot)
          SELECT 'CSE', 2, 'Monday', id, '09:00 AM - 10:00 AM' FROM subjects WHERE code='CS201' LIMIT 1;
       `);
       await pool.query(`
          INSERT INTO timetable (department, year, day, subject_id, time_slot)
          SELECT 'CSE', 2, 'Monday', id, '10:15 AM - 11:15 AM' FROM subjects WHERE code='CS204' LIMIT 1;
       `);
       await pool.query(`
          INSERT INTO timetable (department, year, day, subject_id, time_slot)
          SELECT 'ECE', 2, 'Tuesday', id, '11:30 AM - 12:30 PM' FROM subjects WHERE code='EC205' LIMIT 1;
       `);
       console.log('Seeded partial MVP timetable rows.');
    }

    console.log('Phase 4 Migration Fully Executed!');

  } catch (error) {
    console.error('Migration error', error);
  } finally {
    pool.end();
  }
}

runMigration();
