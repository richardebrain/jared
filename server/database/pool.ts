import { Pool } from 'pg';

// Create a connection pool for PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection when the server starts
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL database:', err);
  }
}

// Run the test
testConnection();