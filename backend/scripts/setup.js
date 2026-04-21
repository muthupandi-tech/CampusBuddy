const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const setupDatabase = async () => {
  // Connect to postgres first to create the db if it doesn't exist
  const initClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres', // default db
  });

  try {
    await initClient.connect();
    // Check if db exists
    const res = await initClient.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${process.env.DB_NAME}'`);
    if (res.rowCount === 0) {
      console.log(`Creating database ${process.env.DB_NAME}...`);
      await initClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('Database created.');
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
    }
  } catch (error) {
    console.error('Error ensuring DB exists:', error);
  } finally {
    await initClient.end();
  }

  // Connect to the new DB and create tables
  const dbClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await dbClient.connect();
    console.log('Connected to target database.');

    const createTablesQuery = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
        department VARCHAR(100),
        year INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Executing tables query...');
    await dbClient.query(createTablesQuery);
    console.log('Tables "users" and "messages" created/verified successfully.');

  } catch (error) {
    console.error('Error executing query', error.stack);
  } finally {
    await dbClient.end();
  }
};

setupDatabase();
