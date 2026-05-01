const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

const migrate = async () => {
  try {
    console.log('Starting Phase 9 migration: Class Assignment system...');

    // 1. Create class_assignments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS class_assignments (
        id SERIAL PRIMARY KEY,
        department VARCHAR(50) NOT NULL,
        year VARCHAR(10) NOT NULL,
        section VARCHAR(10) NOT NULL,
        staff_id UUID REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(department, year, section)
      );
    `);

    // 2. Insert some default sections if they don't exist in sections table
    // (This helps the UI show a grid of classes)
    const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
    const years = ['I', 'II', 'III', 'IV'];
    const sectionNames = ['A', 'B', 'C', 'D'];

    for (const dept of departments) {
      for (const year of years) {
        for (const sec of sectionNames) {
          await db.query(
            'INSERT INTO sections (name, department, year) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [sec, dept, year]
          );
        }
      }
    }

    console.log('Phase 9 migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
