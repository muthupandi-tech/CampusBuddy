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
    console.log('Checking users table for avatar_url...');
    
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
          ALTER TABLE users ADD COLUMN avatar_url TEXT;
        END IF;
      END
      $$;
    `);

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
