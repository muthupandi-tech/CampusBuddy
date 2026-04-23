const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting Announcements Migration...');

    // 1. Add expires_at column
    await client.query(`
      ALTER TABLE announcements 
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    `);
    
    // 2. Set expires_at for existing announcements (created_at + 24 hours)
    await client.query(`
      UPDATE announcements 
      SET expires_at = created_at + INTERVAL '24 hours' 
      WHERE expires_at IS NULL;
    `);

    console.log('Announcements migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
