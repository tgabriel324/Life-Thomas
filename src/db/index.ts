import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes('user:password')) {
  const errorMsg = '❌ ERRO CRÍTICO: DATABASE_URL não configurada ou inválida na Railway. ' +
    'Certifique-se de que você clicou em "Add" na variável sugerida ou conectou o serviço de PostgreSQL.';
  console.error(errorMsg);
  // No ambiente de produção, queremos que o app falhe rápido se não houver banco
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
} else {
  console.log('🔌 Conectando ao banco de dados PostgreSQL...');
}

export const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes('localhost') || databaseUrl?.includes('127.0.0.1') 
    ? false 
    : { rejectUnauthorized: false }
});

// Test connection
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente do banco:', err);
});

export const db = drizzle(pool, { schema });
