import { Pool } from 'pg';

// Uses DATABASE_URL env, e.g. postgres://user:pass@localhost:5432/dbname
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export default pool;
