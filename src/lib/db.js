import { Pool } from 'pg';

// Uses DATABASE_URL env, e.g. postgres://user:pass@localhost:5432/dbname
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Helper function to execute queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Helper function to get a single row
export async function queryOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Helper function to get multiple rows
export async function queryMany(text, params) {
  const result = await query(text, params);
  return result.rows;
}

// Test database connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

export default pool;
