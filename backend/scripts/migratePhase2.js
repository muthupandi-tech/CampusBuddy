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
    console.log('Running Phase 2 Migration...');

    // 1. Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        department VARCHAR(100),
        year INT
      );

      CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        department VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        code VARCHAR(20),
        department VARCHAR(50),
        year INT,
        credits INT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        total_classes INT DEFAULT 0,
        attended_classes INT DEFAULT 0
      );
    `);
    console.log('Tables created.');

    // 2. Migrate existing users to students / staff tables
    console.log('Migrating existing users...');
    const users = await pool.query('SELECT * FROM users');
    for (const u of users.rows) {
      if (u.role === 'student') {
        // check if exists
        const exists = await pool.query('SELECT id FROM students WHERE user_id = $1', [u.id]);
        if (exists.rows.length === 0) {
          await pool.query('INSERT INTO students (user_id, department, year) VALUES ($1, $2, $3)', [u.id, u.department, u.year]);
        }
      } else if (u.role === 'staff') {
         const exists = await pool.query('SELECT id FROM staff WHERE user_id = $1', [u.id]);
         if (exists.rows.length === 0) {
           await pool.query('INSERT INTO staff (user_id, department) VALUES ($1, $2)', [u.id, u.department]);
         }
      }
    }

    // 3. Seed dummy subjects
    console.log('Seeding subjects...');
    await pool.query(`
      INSERT INTO subjects (name, code, department, year, credits) VALUES 
      ('Data Structures', 'CS201', 'CSE', 2, 4),
      ('Web Development', 'CS305', 'CSE', 3, 3),
      ('Database Systems', 'CS204', 'CSE', 2, 4),
      ('Machine Learning', 'CS401', 'CSE', 4, 4),
      ('Digital Logic', 'EC102', 'ECE', 1, 3),
      ('Signals and Systems', 'EC205', 'ECE', 2, 4)
      ON CONFLICT DO NOTHING;
    `);

    // 4. Seed dummy attendance for existing students
    console.log('Seeding attendance...');
    const studentsRes = await pool.query('SELECT id, department, year FROM students');
    for (const s of studentsRes.rows) {
      // Find subjects matching student's department
      const subjects = await pool.query('SELECT id FROM subjects WHERE department = $1', [s.department || 'CSE']);
      for (const sub of subjects.rows) {
        const att = await pool.query('SELECT id FROM attendance WHERE student_id = $1 AND subject_id = $2', [s.id, sub.id]);
        if (att.rows.length === 0) {
          // Rand total classes 10-30, attended 5-total
          const total = Math.floor(Math.random() * 20) + 10;
          const attended = Math.floor(Math.random() * (total - 5)) + 5;
          await pool.query('INSERT INTO attendance (student_id, subject_id, total_classes, attended_classes) VALUES ($1, $2, $3, $4)', [s.id, sub.id, total, attended]);
        }
      }
    }

    console.log('Migration Phase 2 complete.');
  } catch (error) {
    console.error('Migration error', error);
  } finally {
    pool.end();
  }
}

runMigration();
