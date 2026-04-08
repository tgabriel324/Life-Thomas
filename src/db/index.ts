import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not defined in environment variables!');
} else {
  console.log('🔌 Attempting to connect to database...');
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

// Test connection
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle database client', err);
});

export const db = drizzle(pool, { schema });
