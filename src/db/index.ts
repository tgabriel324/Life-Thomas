import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL in index.ts:', databaseUrl ? 'SET' : 'MISSING');

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL is not defined in environment variables.');
  console.error('👉 Action Required: Go to Settings > Secrets and add DATABASE_URL with your PostgreSQL connection string.');
} else if (databaseUrl.includes('user:password')) {
  console.error('❌ ERROR: DATABASE_URL contains placeholder values (user:password).');
  console.error('👉 Action Required: Update DATABASE_URL with your real database credentials.');
} else {
  console.log('🔌 Database connection string detected. Attempting to connect...');
}

export const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 5000, // Fail fast if can't connect
});

// Test connection
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente do banco:', err);
});

export const db = drizzle(pool, { schema });
