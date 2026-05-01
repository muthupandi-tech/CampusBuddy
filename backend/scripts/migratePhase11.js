const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Starting Phase 11 migration: Subject management & Staff restructuring...');

    // 1. Create subjects table
    await db.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL
      );
    `);

    // 2. Create staff_subjects table
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_subjects (
        id SERIAL PRIMARY KEY,
        staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        UNIQUE(staff_id, subject_id)
      );
    `);

    // 3. Create staff_qualifications table
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_qualifications (
        id SERIAL PRIMARY KEY,
        staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
        degree VARCHAR(50) NOT NULL,
        major VARCHAR(100),
        college VARCHAR(150)
      );
    `);

    // 4. Update students table to include section (if missing)
    const checkStudentSection = await db.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='students' AND column_name='section'
    `);
    if (checkStudentSection.rows.length === 0) {
      await db.query(`ALTER TABLE students ADD COLUMN section VARCHAR(10);`);
    }

    // 5. Update users table: remove year for staff (conceptual, we'll keep it in DB but ignore in UI)
    // Actually, users table already has 'year', we just hide it in UI for staff.

    // 6. Seed some subjects if table is empty
    const subjectsCheck = await db.query('SELECT COUNT(*) FROM subjects');
    if (parseInt(subjectsCheck.rows[0].count) === 0) {
      const initialSubjects = [
        ['CS101', 'Introduction to Programming'],
        ['MA102', 'Engineering Mathematics'],
        ['PH103', 'Engineering Physics'],
        ['CS201', 'Data Structures & Algorithms'],
        ['CS301', 'Database Management Systems'],
        ['CS401', 'Operating Systems'],
        ['CS501', 'Computer Networks']
      ];
      for (const [code, name] of initialSubjects) {
        await db.query('INSERT INTO subjects (code, name) VALUES ($1, $2)', [code, name]);
      }
    }

    console.log('Phase 11 migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
