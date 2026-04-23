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
    console.log('Adding department and year to users table...');
    
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='department') THEN
          ALTER TABLE users ADD COLUMN department VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='year') THEN
          ALTER TABLE users ADD COLUMN year INTEGER;
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
