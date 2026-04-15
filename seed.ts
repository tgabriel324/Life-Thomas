
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './src/db/schema';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('Seeding database...');

  try {
    // 1. Create Projects
    const [p1] = await db.insert(schema.projects).values({
      name: 'OPERAÇÃO ALPHA: DOMINAÇÃO',
      description: 'Estratégia macro para escala global e consolidação de mercado.',
      color: '#F59E0B', // Amber
    }).returning();

    const [p2] = await db.insert(schema.projects).values({
      name: 'BIOHACKING & PERFORMANCE',
      description: 'Otimização biológica para sustentar alta carga cognitiva.',
      color: '#10B981', // Emerald
    }).returning();

    // 2. Create Todos for Project 1
    const [t1] = await db.insert(schema.todos).values({
      text: 'Análise de Concorrência: Setor de Agentes IA',
      projectId: p1.id,
      position: 0,
      dueDate: new Date().toISOString().split('T')[0],
    }).returning();

    const [t2] = await db.insert(schema.todos).values({
      text: 'Refinar Motor de Execução (Core Engine)',
      projectId: p1.id,
      position: 1,
      dueDate: new Date().toISOString().split('T')[0],
    }).returning();

    // 3. Create Todos for Project 2
    const [t3] = await db.insert(schema.todos).values({
      text: 'Protocolo de Suplementação Mensal',
      projectId: p2.id,
      position: 0,
      dueDate: new Date().toISOString().split('T')[0],
    }).returning();

    // 4. Add Attachments to t1
    await db.insert(schema.todoAttachments).values([
      {
        todoId: t1.id,
        type: 'link',
        content: 'https://openai.com/research',
        metadata: { title: 'OpenAI Research' }
      },
      {
        todoId: t1.id,
        type: 'text',
        content: 'INSIGHT: O foco deles mudou para raciocínio sistêmico. Precisamos de uma abordagem mais agressiva em execução paralela.',
        metadata: {}
      }
    ]);

    // 5. Add Attachments to t2
    await db.insert(schema.todoAttachments).values([
      {
        todoId: t2.id,
        type: 'code',
        content: 'export const scaleEngine = async (load: number) => {\n  const nodes = Math.ceil(load / 1000);\n  return await deployNodes(nodes);\n};',
        metadata: { language: 'typescript' }
      },
      {
        todoId: t2.id,
        type: 'repo',
        content: 'https://github.com/empire/core-engine',
        metadata: {}
      }
    ]);

    // 6. Add Attachments to t3
    await db.insert(schema.todoAttachments).values([
      {
        todoId: t3.id,
        type: 'image',
        content: 'https://picsum.photos/seed/health/800/600',
        metadata: { caption: 'Tabela de Biomarcadores' }
      },
      {
        todoId: t3.id,
        type: 'checklist',
        content: '- Magnésio Treonato (Noite)\n- Vitamina D3 + K2 (Manhã)\n- NMN 500mg (Jejum)',
        metadata: {}
      }
    ]);

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
