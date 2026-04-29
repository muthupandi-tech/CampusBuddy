const db = require('../config/db');

async function createTables() {
  try {
    console.log('Creating Classroom tables...');
    
    // Classrooms Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        subject VARCHAR(100),
        staff_id UUID REFERENCES users(id),
        department VARCHAR(50),
        year VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Classroom Members Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS classroom_members (
        id SERIAL PRIMARY KEY,
        classroom_id INT REFERENCES classrooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        role VARCHAR(20),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Classroom Messages Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS classroom_messages (
        id SERIAL PRIMARY KEY,
        classroom_id INT REFERENCES classrooms(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Classroom Resources Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS classroom_resources (
        id SERIAL PRIMARY KEY,
        classroom_id INT REFERENCES classrooms(id) ON DELETE CASCADE,
        title VARCHAR(150),
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Blocked Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        blocked_user_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Classroom tables created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    process.exit(0);
  }
}

createTables();
