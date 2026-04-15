import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, pool } from './src/db/index.ts';
import { projects, todos, teamMembers, objectives, goals } from './src/db/schema.ts';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log('🚀 Server starting...');
  
  // --- Database Connection Check ---
  let isMockMode = false;
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined.');
    }
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15));
    const client = await pool.connect();
    console.log('✅ Database connection established successfully.');
    client.release();
  } catch (error) {
    isMockMode = true;
    console.error('⚠️ MOCK MODE ACTIVATED:', error instanceof Error ? error.message : String(error));
    console.warn('👉 Using in-memory mock data for UI/UX testing.');
  }

  // Mock Data Store
  const mockData = {
    projects: [
      { id: 1, name: 'OPERAÇÃO ALPHA: DOMINAÇÃO', description: 'Estratégia macro para escala global.', color: '#F59E0B' },
      { id: 2, name: 'BIOHACKING & PERFORMANCE', description: 'Otimização biológica.', color: '#10B981' }
    ],
    todos: [
      { id: 1, text: 'Análise de Concorrência: Setor de Agentes IA', completed: 0, position: 0, projectId: 1, dueDate: new Date().toISOString() },
      { id: 2, text: 'Refinar Motor de Execução (Core Engine)', completed: 0, position: 1, projectId: 1, dueDate: new Date().toISOString() },
      { id: 3, text: 'Protocolo de Suplementação Mensal', completed: 1, position: 0, projectId: 2, dueDate: new Date().toISOString() }
    ],
    attachments: [
      { id: 1, todoId: 1, type: 'link', content: 'https://openai.com/research', metadata: { title: 'OpenAI Research' }, createdAt: new Date().toISOString() },
      { id: 2, todoId: 1, type: 'text', content: 'INSIGHT: Foco em raciocínio sistêmico.', metadata: {}, createdAt: new Date().toISOString() },
      { id: 3, todoId: 2, type: 'code', content: 'export const scale = () => {};', metadata: { language: 'typescript' }, createdAt: new Date().toISOString() },
      { id: 4, todoId: 3, type: 'image', content: 'https://picsum.photos/seed/health/800/600', metadata: { caption: 'Biomarcadores' }, createdAt: new Date().toISOString() }
    ],
    agents: [
      { id: 1, name: 'Life Thomas (Deus)', type: 'system', description: 'Núcleo central de consciência.', status: 'active' },
      { id: 2, name: 'Diretor de Operações', type: 'director', description: 'Gestão tática do império.', status: 'active' }
    ],
    teamMembers: [
      { id: 1, name: 'João Silva', role: 'Gestor de Tráfego', specialty: 'Google Ads & Meta', email: 'joao@empire.com', whatsapp: '11999999999', avatar: 'https://i.pravatar.cc/150?u=joao', status: 'available' },
      { id: 2, name: 'Ana Costa', role: 'Designer UI/UX', specialty: 'Figma & Branding', email: 'ana@empire.com', whatsapp: '11888888888', avatar: 'https://i.pravatar.cc/150?u=ana', status: 'focused' }
    ],
    objectives: [
      { id: 1, title: 'DOMINAÇÃO DE MERCADO 2026', description: 'Tornar-se a maior referência em IA aplicada a negócios.', status: 'active' }
    ],
    goals: [
      { id: 1, objectiveId: 1, title: 'Faturamento R$ 1M', targetValue: '1000000', currentValue: '250000', deadline: '2026-12-31', status: 'active' }
    ]
  };

  // --- Auto-Migration ---
  if (!isMockMode) {
    try {
      const migrationsPath = path.join(process.cwd(), 'drizzle');
      console.log(`🔄 Running database migrations from: ${migrationsPath}`);
      await migrate(db, { migrationsFolder: migrationsPath });
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  app.use(express.json());

  // --- Health Check ---
  app.get('/api/health', async (req, res) => {
    try {
      if (isMockMode) {
        return res.json({ status: 'ok', database: 'mocked', env: 'MISSING' });
      }
      await db.execute(sql`SELECT 1`);
      res.json({ 
        status: 'ok', 
        database: 'connected',
        env: process.env.DATABASE_URL ? `SET (${process.env.DATABASE_URL.substring(0, 10)}...)` : 'MISSING'
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        database: 'disconnected', 
        message: error instanceof Error ? error.message : String(error),
        env: process.env.DATABASE_URL ? `SET (${process.env.DATABASE_URL.substring(0, 10)}...)` : 'MISSING',
        hint: 'Check if DATABASE_URL is correct and SSL is enabled if required.'
      });
    }
  });

  // --- Setup Database Route ---
  app.post('/api/setup-db', async (req, res) => {
    try {
      console.log('🛠️ Manually triggering database setup...');
      
      // Try to enable vector extension
      try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('✅ Vector extension ensured.');
      } catch (e) {
        console.warn('⚠️ Could not enable vector extension. Vector operations might fail.', e);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "projects" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "color" text DEFAULT '#000000',
          "created_at" timestamp DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS "todos" (
          "id" serial PRIMARY KEY NOT NULL,
          "text" text NOT NULL,
          "completed" boolean DEFAULT false,
          "position" integer NOT NULL,
          "project_id" integer REFERENCES "projects"("id") ON DELETE SET NULL,
          "due_date" text,
          "created_at" timestamp DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS "agents" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "type" text NOT NULL,
          "parent_id" integer,
          "linked_id" integer,
          "description" text,
          "persona" text,
          "scope" text,
          "goals" text,
          "instructions" text,
          "status" text DEFAULT 'active',
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS "agent_memories" (
          "id" serial PRIMARY KEY NOT NULL,
          "agent_id" integer REFERENCES "agents"("id") ON DELETE CASCADE,
          "content" text NOT NULL,
          "embedding" vector(1536),
          "metadata" jsonb,
          "created_at" timestamp DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS "todo_attachments" (
          "id" serial PRIMARY KEY NOT NULL,
          "todo_id" integer REFERENCES "todos"("id") ON DELETE CASCADE,
          "type" text NOT NULL,
          "content" text NOT NULL,
          "metadata" jsonb,
          "created_at" timestamp DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS "team_members" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "role" text NOT NULL,
          "specialty" text,
          "email" text,
          "whatsapp" text,
          "avatar" text,
          "status" text DEFAULT 'available',
          "created_at" timestamp DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS "objectives" (
          "id" serial PRIMARY KEY NOT NULL,
          "title" text NOT NULL,
          "description" text,
          "status" text DEFAULT 'active',
          "created_at" timestamp DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS "goals" (
          "id" serial PRIMARY KEY NOT NULL,
          "objective_id" integer REFERENCES "objectives"("id") ON DELETE CASCADE,
          "title" text NOT NULL,
          "target_value" text,
          "current_value" text DEFAULT '0',
          "deadline" text,
          "status" text DEFAULT 'active',
          "created_at" timestamp DEFAULT now()
        );
        -- Update todos table if it exists but missing columns
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todos') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'priority') THEN
              ALTER TABLE "todos" ADD COLUMN "priority" text DEFAULT 'medium';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'assigned_to') THEN
              ALTER TABLE "todos" ADD COLUMN "assigned_to" integer REFERENCES "team_members"("id") ON DELETE SET NULL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'goal_id') THEN
              ALTER TABLE "todos" ADD COLUMN "goal_id" integer REFERENCES "goals"("id") ON DELETE SET NULL;
            END IF;
          END IF;
        END $$;
      `);
      res.json({ success: true, message: 'Database tables and extensions ensured.' });
    } catch (error) {
      console.error('❌ Manual setup failed:', error);
      res.status(500).json({ error: 'Manual setup failed', details: String(error) });
    }
  });

  // --- Project Routes ---
  app.get('/api/projects', async (req, res) => {
    if (isMockMode) return res.json(mockData.projects);
    try {
      const allProjects = await db.select().from(projects);
      res.json(allProjects);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      
      // Emergency Fallback: If table doesn't exist, try to create it manually
      if (msg.includes('does not exist') || msg.includes('Failed query')) {
        console.log('⚠️ Tables might be missing. Attempting emergency creation...');
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS "projects" (
              "id" serial PRIMARY KEY NOT NULL,
              "name" text NOT NULL,
              "description" text,
              "color" text DEFAULT '#000000',
              "created_at" timestamp DEFAULT now()
            );
            CREATE TABLE IF NOT EXISTS "todos" (
              "id" serial PRIMARY KEY NOT NULL,
              "text" text NOT NULL,
              "completed" boolean DEFAULT false,
              "position" integer NOT NULL,
              "project_id" integer REFERENCES "projects"("id") ON DELETE SET NULL,
              "due_date" text,
              "created_at" timestamp DEFAULT now()
            );
          `);
          console.log('✅ Emergency tables created. Retrying query...');
          const retryProjects = await db.select().from(projects);
          return res.json(retryProjects);
        } catch (innerError) {
          console.error('❌ Emergency creation failed:', innerError);
        }
      }

      console.error('Failed to fetch projects:', msg);
      res.status(500).json({ error: 'Failed to fetch projects', details: msg });
    }
  });

  app.post('/api/projects', async (req, res) => {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    if (isMockMode) {
      const newProject = {
        id: Math.max(...mockData.projects.map(p => p.id)) + 1,
        name,
        description: description || '',
        color: color || '#000000',
        createdAt: new Date().toISOString()
      };
      mockData.projects.push(newProject as any);
      return res.status(201).json(newProject);
    }

    try {
      const [newProject] = await db.insert(projects).values({
        name,
        description: description || '',
        color: color || '#000000',
      }).returning();

      // Create associated Project Agent
      try {
        const { agents: agentsTable } = await import('./src/db/schema.ts');
        await db.insert(agentsTable).values({
          name: `Agente ${name}`,
          type: 'project',
          linkedId: newProject.id,
          description: `Especialista focado no projeto: ${name}.`,
          persona: 'Gerente de projeto técnico, focado em prazos e qualidade de código.',
          scope: `Gerenciamento e execução do projeto ${name}.`,
          goals: `Garantir que o projeto ${name} seja concluído com excelência.`,
          instructions: 'Analise as tarefas deste projeto e sugira otimizações constantes.',
        });
      } catch (agentError) {
        console.error('Failed to create project agent:', agentError);
      }

      res.status(201).json(newProject);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      
      // Fallback for POST
      if (msg.includes('does not exist') || msg.includes('Failed query')) {
        try {
          await pool.query('CREATE TABLE IF NOT EXISTS "projects" ("id" serial PRIMARY KEY, "name" text NOT NULL, "description" text, "color" text, "created_at" timestamp DEFAULT now())');
          const [retryProject] = await db.insert(projects).values({
            name,
            description: description || '',
            color: color || '#000000',
          }).returning();
          return res.status(201).json(retryProject);
        } catch (inner) {
          console.error('❌ Emergency POST creation failed:', inner);
        }
      }

      console.error('Failed to create project:', msg);
      res.status(500).json({ error: 'Failed to create project', details: msg });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      mockData.projects = mockData.projects.filter(p => p.id !== Number(id));
      return res.status(204).send();
    }
    try {
      const { agents: agentsTable } = await import('./src/db/schema.ts');
      
      // Delete associated agents first
      await db.delete(agentsTable).where(sql`${agentsTable.type} = 'project' AND ${agentsTable.linkedId} = ${Number(id)}`);
      
      await db.delete(projects).where(eq(projects.id, Number(id)));
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  // --- Agent Routes ---
  app.get('/api/agents', async (req, res) => {
    if (isMockMode) return res.json(mockData.agents);
    try {
      const { agents: agentsTable } = await import('./src/db/schema.ts');
      const allAgents = await db.select().from(agentsTable);
      res.json(allAgents);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      
      if (msg.includes('does not exist') || msg.includes('Failed query')) {
        console.log('⚠️ Agents table might be missing. Attempting emergency creation...');
        try {
          await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS "agents" (
              "id" serial PRIMARY KEY NOT NULL,
              "name" text NOT NULL,
              "type" text NOT NULL,
              "parent_id" integer,
              "linked_id" integer,
              "description" text,
              "persona" text,
              "scope" text,
              "goals" text,
              "instructions" text,
              "status" text DEFAULT 'active',
              "created_at" timestamp DEFAULT now(),
              "updated_at" timestamp DEFAULT now()
            );
            CREATE TABLE IF NOT EXISTS "agent_memories" (
              "id" serial PRIMARY KEY NOT NULL,
              "agent_id" integer REFERENCES "agents"("id") ON DELETE CASCADE,
              "content" text NOT NULL,
              "embedding" vector(1536),
              "metadata" jsonb,
              "created_at" timestamp DEFAULT now()
            );
          `);
          console.log('✅ Emergency agents tables created. Retrying query...');
          const { agents: agentsTableRetry } = await import('./src/db/schema.ts');
          const retryAgents = await db.select().from(agentsTableRetry);
          return res.json(retryAgents);
        } catch (innerError) {
          console.error('❌ Emergency agents creation failed:', innerError);
        }
      }

      console.error('Failed to fetch agents:', msg);
      res.status(500).json({ error: 'Failed to fetch agents', details: msg });
    }
  });

  app.post('/api/agents/sync', async (req, res) => {
    try {
      const { agents: agentsTable } = await import('./src/db/schema.ts');
      
      console.log('🔄 Starting Agent Hierarchy Sync...');

      // 1. Ensure DEUS (System Agent) exists
      let [deus] = await db.select().from(agentsTable).where(eq(agentsTable.type, 'system'));
      if (!deus) {
        console.log('✨ Creating DEUS...');
        [deus] = await db.insert(agentsTable).values({
          name: 'Life Thomas (Deus)',
          type: 'system',
          description: 'O agente macro que entende todo o sistema e a visão bilionária.',
          persona: 'Estrategista de elite, mentor, focado em escala e visão de longo prazo.',
          scope: 'Todo o sistema Life Thomas, integração de projetos e alinhamento de vida.',
          goals: 'Transformar a vida do Thomas em um império bilionário através de organização e inteligência.',
          instructions: 'Sempre considere o impacto de longo prazo. Priorize escala. Mantenha o alinhamento entre micro tarefas e macro objetivos.',
        }).returning();
      }

      // 2. Ensure PROJECTS DIRECTOR (Director Agent) exists
      let [projectsDirector] = await db.select().from(agentsTable).where(eq(agentsTable.type, 'director'));
      if (!projectsDirector) {
        console.log('✨ Creating Projects Director...');
        [projectsDirector] = await db.insert(agentsTable).values({
          name: 'Diretor de Projetos',
          type: 'director',
          parentId: deus.id,
          description: 'Responsável por supervisionar todos os projetos e garantir o alinhamento estratégico.',
          persona: 'Gestor de portfólio experiente, focado em recursos, prazos globais e sinergia entre projetos.',
          scope: 'Visão geral de todos os projetos ativos no sistema.',
          goals: 'Otimizar a alocação de tempo e energia entre os diferentes projetos do Thomas.',
          instructions: 'Analise a carga de trabalho total. Identifique projetos que estão parados. Sugira conexões entre projetos diferentes.',
        }).returning();
      }

      // 3. Sync PROJECTS
      const allProjects = await db.select().from(projects);
      for (const project of allProjects) {
        let [projectAgent] = await db.select().from(agentsTable).where(
          sql`${agentsTable.type} = 'project' AND ${agentsTable.linkedId} = ${project.id}`
        );

        if (!projectAgent) {
          console.log(`✨ Creating Agent for Project: ${project.name}`);
          await db.insert(agentsTable).values({
            name: `Agente ${project.name}`,
            type: 'project',
            parentId: projectsDirector.id,
            linkedId: project.id,
            description: `Especialista focado no projeto: ${project.name}.`,
            persona: 'Gerente de projeto técnico, focado em prazos e qualidade de código.',
            scope: `Gerenciamento e execução do projeto ${project.name}.`,
            goals: `Garantir que o projeto ${project.name} seja concluído com excelência.`,
            instructions: 'Analise as tarefas deste projeto e sugira otimizações constantes.',
          });
        } else if (projectAgent.parentId !== projectsDirector.id) {
          // Update parent if needed
          await db.update(agentsTable).set({ parentId: projectsDirector.id }).where(eq(agentsTable.id, projectAgent.id));
        }
      }

      // 4. Sync TASKS
      const allTodos = await db.select().from(todos);
      for (const todo of allTodos) {
        let [taskAgent] = await db.select().from(agentsTable).where(
          sql`${agentsTable.type} = 'task' AND ${agentsTable.linkedId} = ${todo.id}`
        );

        // Find parent project agent
        let parentId = null;
        if (todo.projectId) {
          const [parentProjectAgent] = await db.select().from(agentsTable).where(
            sql`${agentsTable.type} = 'project' AND ${agentsTable.linkedId} = ${todo.projectId}`
          );
          if (parentProjectAgent) parentId = parentProjectAgent.id;
        }

        if (!taskAgent) {
          console.log(`✨ Creating Agent for Task: ${todo.text.substring(0, 20)}`);
          await db.insert(agentsTable).values({
            name: `Executor: ${todo.text.substring(0, 20)}${todo.text.length > 20 ? '...' : ''}`,
            type: 'task',
            parentId: parentId,
            linkedId: todo.id,
            description: `Especialista focado na execução da tarefa: ${todo.text}.`,
            persona: 'Executor ágil, focado em micro-decisões e eficiência técnica.',
            scope: `Execução da tarefa ID ${todo.id}.`,
            goals: 'Completar a tarefa da forma mais eficiente possível.',
            instructions: 'Foque nos detalhes técnicos e impeça qualquer bloqueio na execução.',
          });
        } else if (taskAgent.parentId !== parentId) {
          await db.update(agentsTable).set({ parentId: parentId }).where(eq(agentsTable.id, taskAgent.id));
        }
      }

      res.json({ success: true, message: 'Hierarchy sync completed.' });
    } catch (error) {
      console.error('❌ Sync failed:', error);
      res.status(500).json({ error: 'Sync failed', details: String(error) });
    }
  });

  app.post('/api/agents/seed', async (req, res) => {
    try {
      const { agents: agentsTable } = await import('./src/db/schema.ts');
      
      // Check if Deus exists
      const [deus] = await db.select().from(agentsTable).where(eq(agentsTable.type, 'system'));
      
      if (deus) {
        return res.json({ message: 'System agent already exists', agent: deus });
      }

      const [newDeus] = await db.insert(agentsTable).values({
        name: 'Life Thomas (Deus)',
        type: 'system',
        description: 'O agente macro que entende todo o sistema e a visão bilionária.',
        persona: 'Estrategista de elite, mentor, focado em escala e visão de longo prazo.',
        scope: 'Todo o sistema Life Thomas, integração de projetos e alinhamento de vida.',
        goals: 'Transformar a vida do Thomas em um império bilionário através de organização e inteligência.',
        instructions: 'Sempre considere o impacto de longo prazo. Priorize escala. Mantenha o alinhamento entre micro tarefas e macro objetivos.',
      }).returning();

      res.status(201).json(newDeus);
    } catch (error) {
      console.error('Failed to seed system agent:', error);
      res.status(500).json({ error: 'Failed to seed system agent' });
    }
  });

  app.post('/api/agents', async (req, res) => {
    try {
      const { agents: agentsTable } = await import('./src/db/schema.ts');
      const newAgent = await db.insert(agentsTable).values(req.body).returning();
      res.status(201).json(newAgent[0]);
    } catch (error) {
      console.error('Failed to create agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  });

  // --- Agent Memory & RAG Routes ---
  app.post('/api/agents/:id/memories', async (req, res) => {
    const { id } = req.params;
    const { content, embedding, metadata } = req.body;
    
    try {
      const { agentMemories: memoriesTable } = await import('./src/db/schema.ts');
      
      // Convert embedding array to postgres vector string format: [1,2,3]
      const vectorStr = `[${embedding.join(',')}]`;
      
      const [newMemory] = await db.insert(memoriesTable).values({
        agentId: Number(id),
        content,
        embedding: sql`${vectorStr}::vector`,
        metadata: metadata || {},
      }).returning();
      
      res.status(201).json(newMemory);
    } catch (error) {
      console.error('Failed to save agent memory:', error);
      res.status(500).json({ error: 'Failed to save agent memory', details: String(error) });
    }
  });

  app.post('/api/agents/search', async (req, res) => {
    const { embedding, limit = 5, agentId } = req.body;
    
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: 'Embedding array is required' });
    }

    try {
      const { agentMemories: memoriesTable } = await import('./src/db/schema.ts');
      const vectorStr = `[${embedding.join(',')}]`;
      
      // Cosine similarity search using pgvector operator <=> (distance)
      // 1 - (embedding <=> vector) is similarity
      let query = db.select({
        id: memoriesTable.id,
        content: memoriesTable.content,
        metadata: memoriesTable.metadata,
        similarity: sql<number>`1 - (${memoriesTable.embedding} <=> ${vectorStr}::vector)`
      })
      .from(memoriesTable);

      if (agentId) {
        query = query.where(eq(memoriesTable.agentId, Number(agentId))) as any;
      }

      const results = await query
        .orderBy(sql`${memoriesTable.embedding} <=> ${vectorStr}::vector`)
        .limit(limit);

      res.json(results);
    } catch (error) {
      console.error('Failed to search agent memories:', error);
      res.status(500).json({ error: 'Failed to search agent memories', details: String(error) });
    }
  });

  // --- Team Routes ---
  app.get('/api/team', async (req, res) => {
    if (isMockMode) return res.json(mockData.teamMembers);
    try {
      const allMembers = await db.select().from(teamMembers);
      res.json(allMembers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  });

  app.post('/api/team', async (req, res) => {
    if (isMockMode) {
      const newMember = {
        id: Math.max(...mockData.teamMembers.map(m => m.id)) + 1,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      mockData.teamMembers.push(newMember as any);
      return res.status(201).json(newMember);
    }
    try {
      const [newMember] = await db.insert(teamMembers).values(req.body).returning();
      res.status(201).json(newMember);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create team member' });
    }
  });

  app.patch('/api/team/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      const index = mockData.teamMembers.findIndex(m => m.id === Number(id));
      if (index === -1) return res.status(404).json({ error: 'Member not found' });
      mockData.teamMembers[index] = { ...mockData.teamMembers[index], ...req.body };
      return res.json(mockData.teamMembers[index]);
    }
    try {
      const [updatedMember] = await db.update(teamMembers)
        .set(req.body)
        .where(eq(teamMembers.id, Number(id)))
        .returning();
      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update team member' });
    }
  });

  app.delete('/api/team/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      mockData.teamMembers = mockData.teamMembers.filter(m => m.id !== Number(id));
      return res.status(204).send();
    }
    try {
      await db.delete(teamMembers).where(eq(teamMembers.id, Number(id)));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete team member' });
    }
  });

  // --- Strategy Routes (Objectives & Goals) ---
  app.get('/api/objectives', async (req, res) => {
    if (isMockMode) return res.json(mockData.objectives);
    try {
      const allObjectives = await db.select().from(objectives);
      res.json(allObjectives);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch objectives' });
    }
  });

  app.post('/api/objectives', async (req, res) => {
    if (isMockMode) {
      const newObjective = {
        id: mockData.objectives.length > 0 ? Math.max(...mockData.objectives.map(o => o.id)) + 1 : 1,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      mockData.objectives.push(newObjective as any);
      return res.status(201).json(newObjective);
    }
    try {
      const [newObjective] = await db.insert(objectives).values(req.body).returning();
      res.status(201).json(newObjective);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create objective' });
    }
  });

  app.patch('/api/objectives/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      const index = mockData.objectives.findIndex(o => o.id === Number(id));
      if (index === -1) return res.status(404).json({ error: 'Objective not found' });
      mockData.objectives[index] = { ...mockData.objectives[index], ...req.body };
      return res.json(mockData.objectives[index]);
    }
    try {
      const [updatedObjective] = await db.update(objectives)
        .set(req.body)
        .where(eq(objectives.id, Number(id)))
        .returning();
      res.json(updatedObjective);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update objective' });
    }
  });

  app.delete('/api/objectives/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      mockData.objectives = mockData.objectives.filter(o => o.id !== Number(id));
      return res.status(204).send();
    }
    try {
      await db.delete(objectives).where(eq(objectives.id, Number(id)));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete objective' });
    }
  });

  app.get('/api/goals', async (req, res) => {
    if (isMockMode) return res.json(mockData.goals);
    try {
      const allGoals = await db.select().from(goals);
      res.json(allGoals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch goals' });
    }
  });

  app.post('/api/goals', async (req, res) => {
    if (isMockMode) {
      const newGoal = {
        id: mockData.goals.length > 0 ? Math.max(...mockData.goals.map(g => g.id)) + 1 : 1,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      mockData.goals.push(newGoal as any);
      return res.status(201).json(newGoal);
    }
    try {
      const [newGoal] = await db.insert(goals).values(req.body).returning();
      res.status(201).json(newGoal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create goal' });
    }
  });

  app.patch('/api/goals/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      const index = mockData.goals.findIndex(g => g.id === Number(id));
      if (index === -1) return res.status(404).json({ error: 'Goal not found' });
      mockData.goals[index] = { ...mockData.goals[index], ...req.body };
      return res.json(mockData.goals[index]);
    }
    try {
      const [updatedGoal] = await db.update(goals)
        .set(req.body)
        .where(eq(goals.id, Number(id)))
        .returning();
      res.json(updatedGoal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update goal' });
    }
  });

  app.delete('/api/goals/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      mockData.goals = mockData.goals.filter(g => g.id !== Number(id));
      return res.status(204).send();
    }
    try {
      await db.delete(goals).where(eq(goals.id, Number(id)));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete goal' });
    }
  });

  // --- Todo Routes ---
  app.get('/api/todos', async (req, res) => {
    try {
      const { projectId, assignedTo, goalId } = req.query;
      if (isMockMode) {
        let filtered = mockData.todos;
        if (projectId) filtered = filtered.filter(t => t.projectId === Number(projectId));
        if (assignedTo) filtered = filtered.filter(t => (t as any).assignedTo === Number(assignedTo));
        if (goalId) filtered = filtered.filter(t => (t as any).goalId === Number(goalId));
        return res.json(filtered);
      }
      
      let conditions = [];
      if (projectId) conditions.push(eq(todos.projectId, Number(projectId)));
      if (assignedTo) conditions.push(eq(todos.assignedTo, Number(assignedTo)));
      if (goalId) conditions.push(eq(todos.goalId, Number(goalId)));

      let query = db.select().from(todos).orderBy(asc(todos.position));
      
      if (conditions.length > 0) {
        // @ts-ignore
        query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
      }
      
      const allTodos = await query;
      res.json(allTodos);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      
      // Emergency Fallback
      if (msg.includes('does not exist') || msg.includes('Failed query')) {
        console.log('⚠️ Tables might be missing in todos route. Attempting emergency creation...');
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS "projects" (
              "id" serial PRIMARY KEY NOT NULL,
              "name" text NOT NULL,
              "description" text,
              "color" text DEFAULT '#000000',
              "created_at" timestamp DEFAULT now()
            );
            CREATE TABLE IF NOT EXISTS "todos" (
              "id" serial PRIMARY KEY NOT NULL,
              "text" text NOT NULL,
              "completed" boolean DEFAULT false,
              "position" integer NOT NULL,
              "project_id" integer REFERENCES "projects"("id") ON DELETE SET NULL,
              "due_date" text,
              "created_at" timestamp DEFAULT now()
            );
          `);
          const retryTodos = await db.select().from(todos).orderBy(asc(todos.position));
          return res.json(retryTodos);
        } catch (innerError) {
          console.error('❌ Emergency creation failed:', innerError);
        }
      }

      console.error('Failed to fetch todos:', msg);
      res.status(500).json({ error: 'Failed to fetch todos', details: msg });
    }
  });

  app.post('/api/todos', async (req, res) => {
    const { text, projectId, project_id, dueDate, due_date, priority, assignedTo, assigned_to, goalId, goal_id } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const finalProjectId = projectId || project_id;
    const finalDueDate = dueDate || due_date;
    const finalAssignedTo = assignedTo || assigned_to;
    const finalGoalId = goalId || goal_id;

    if (isMockMode) {
      const nextPos = mockData.todos.length > 0 
        ? Math.max(...mockData.todos.map(t => t.position)) + 1 
        : 0;
      const newTodo = {
        id: mockData.todos.length > 0 ? Math.max(...mockData.todos.map(t => t.id)) + 1 : 1,
        text,
        position: nextPos,
        projectId: finalProjectId || null,
        dueDate: finalDueDate || null,
        completed: false,
        priority: priority || 'medium',
        assignedTo: finalAssignedTo || null,
        goalId: finalGoalId || null,
        createdAt: new Date().toISOString()
      };
      mockData.todos.push(newTodo as any);
      return res.status(201).json(newTodo);
    }

    try {
      // Get max position using a more robust query
      const [lastTodo] = await db.select().from(todos).orderBy(desc(todos.position)).limit(1);
      const nextPos = (lastTodo?.position ?? -1) + 1;

      const [newTodo] = await db.insert(todos).values({
        text,
        position: nextPos,
        projectId: finalProjectId || null,
        dueDate: finalDueDate || null,
        completed: false,
        priority: priority || 'medium',
        assignedTo: finalAssignedTo || null,
        goalId: finalGoalId || null
      }).returning();
      
      // Create associated Task Agent
      try {
        const { agents: agentsTable } = await import('./src/db/schema.ts');
        await db.insert(agentsTable).values({
          name: `Executor: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`,
          type: 'task',
          linkedId: newTodo.id,
          description: `Especialista focado na execução da tarefa: ${text}.`,
          persona: 'Executor ágil, focado em micro-decisões e eficiência técnica.',
          scope: `Execução da tarefa ID ${newTodo.id}.`,
          goals: 'Completar a tarefa da forma mais eficiente possível.',
          instructions: 'Foque nos detalhes técnicos e impeça qualquer bloqueio na execução.',
        });
      } catch (agentError) {
        console.error('Failed to create task agent:', agentError);
      }

      res.status(201).json(newTodo);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Failed to create todo:', msg);
      res.status(500).json({ error: 'Failed to create todo', details: msg });
    }
  });

  app.patch('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { text, completed, projectId, project_id, dueDate, due_date, priority, assignedTo, assigned_to, goalId, goal_id } = req.body;

    if (isMockMode) {
      const index = mockData.todos.findIndex(t => t.id === Number(id));
      if (index === -1) return res.status(404).json({ error: 'Todo not found' });
      
      const updates: any = {};
      if (text !== undefined) updates.text = text;
      if (completed !== undefined) updates.completed = !!completed;
      if (projectId !== undefined || project_id !== undefined) updates.projectId = projectId || project_id;
      if (dueDate !== undefined || due_date !== undefined) updates.dueDate = dueDate || due_date;
      if (priority !== undefined) updates.priority = priority;
      if (assignedTo !== undefined || assigned_to !== undefined) updates.assignedTo = assignedTo || assigned_to;
      if (goalId !== undefined || goal_id !== undefined) updates.goalId = goalId || goal_id;

      mockData.todos[index] = { ...mockData.todos[index], ...updates };
      return res.json(mockData.todos[index]);
    }

    try {
      const updates: any = {};
      if (text !== undefined) updates.text = text;
      if (completed !== undefined) updates.completed = !!completed;
      if (projectId !== undefined || project_id !== undefined) updates.projectId = projectId || project_id;
      if (dueDate !== undefined || due_date !== undefined) updates.dueDate = dueDate || due_date;
      if (priority !== undefined) updates.priority = priority;
      if (assignedTo !== undefined || assigned_to !== undefined) updates.assignedTo = assignedTo || assigned_to;
      if (goalId !== undefined || goal_id !== undefined) updates.goalId = goalId || goal_id;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const [updatedTodo] = await db.update(todos)
        .set(updates)
        .where(eq(todos.id, Number(id)))
        .returning();
      
      if (!updatedTodo) return res.status(404).json({ error: 'Todo not found' });
      
      res.json(updatedTodo);
    } catch (error) {
      console.error('Failed to update todo:', error);
      res.status(500).json({ error: 'Failed to update todo' });
    }
  });

  app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      mockData.todos = mockData.todos.filter(t => t.id !== Number(id));
      return res.status(204).send();
    }
    try {
      const { agents: agentsTable } = await import('./src/db/schema.ts');
      
      // Delete associated task agent
      await db.delete(agentsTable).where(sql`${agentsTable.type} = 'task' AND ${agentsTable.linkedId} = ${Number(id)}`);
      
      const result = await db.delete(todos).where(eq(todos.id, Number(id))).returning();
      if (result.length === 0) return res.status(404).json({ error: 'Todo not found' });
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      res.status(500).json({ error: 'Failed to delete todo' });
    }
  });

  // --- Todo Attachment Routes ---
  app.get('/api/todos/:id/attachments', async (req, res) => {
    const { id } = req.params;
    if (isMockMode) {
      return res.json(mockData.attachments.filter(a => a.todoId === Number(id)));
    }
    try {
      const { todoAttachments: attachmentsTable } = await import('./src/db/schema.ts');
      const attachments = await db.select().from(attachmentsTable).where(eq(attachmentsTable.todoId, Number(id)));
      res.json(attachments);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      res.status(500).json({ error: 'Failed to fetch attachments' });
    }
  });

  app.post('/api/todos/:id/attachments', async (req, res) => {
    const { id } = req.params;
    const { type, content, metadata } = req.body;
    try {
      const { todoAttachments: attachmentsTable } = await import('./src/db/schema.ts');
      const [newAttachment] = await db.insert(attachmentsTable).values({
        todoId: Number(id),
        type,
        content,
        metadata: metadata || {}
      }).returning();
      res.status(201).json(newAttachment);
    } catch (error) {
      console.error('Failed to create attachment:', error);
      res.status(500).json({ error: 'Failed to create attachment' });
    }
  });

  app.delete('/api/attachments/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { todoAttachments: attachmentsTable } = await import('./src/db/schema.ts');
      await db.delete(attachmentsTable).where(eq(attachmentsTable.id, Number(id)));
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      res.status(500).json({ error: 'Failed to delete attachment' });
    }
  });

  app.post('/api/seed', async (req, res) => {
    if (isMockMode) {
      return res.json({ success: true, message: 'Mock data is already active. No database to seed.' });
    }
    try {
      const { projects: projectsTable, todos: todosTable, todoAttachments: attachmentsTable } = await import('./src/db/schema.ts');
      
      // 1. Create Projects
      const [p1] = await db.insert(projectsTable).values({
        name: 'OPERAÇÃO ALPHA: DOMINAÇÃO',
        description: 'Estratégia macro para escala global e consolidação de mercado.',
        color: '#F59E0B', // Amber
      }).returning();

      const [p2] = await db.insert(projectsTable).values({
        name: 'BIOHACKING & PERFORMANCE',
        description: 'Otimização biológica para sustentar alta carga cognitiva.',
        color: '#10B981', // Emerald
      }).returning();

      // 2. Create Todos for Project 1
      const [t1] = await db.insert(todosTable).values({
        text: 'Análise de Concorrência: Setor de Agentes IA',
        projectId: p1.id,
        position: 0,
        dueDate: new Date().toISOString().split('T')[0],
      }).returning();

      const [t2] = await db.insert(todosTable).values({
        text: 'Refinar Motor de Execução (Core Engine)',
        projectId: p1.id,
        position: 1,
        dueDate: new Date().toISOString().split('T')[0],
      }).returning();

      // 3. Create Todos for Project 2
      const [t3] = await db.insert(todosTable).values({
        text: 'Protocolo de Suplementação Mensal',
        projectId: p2.id,
        position: 0,
        dueDate: new Date().toISOString().split('T')[0],
      }).returning();

      // 4. Add Attachments to t1
      await db.insert(attachmentsTable).values([
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
      await db.insert(attachmentsTable).values([
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
      await db.insert(attachmentsTable).values([
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

      res.json({ success: true, message: 'Seed completed successfully!' });
    } catch (error) {
      console.error('Seed failed:', error);
      res.status(500).json({ 
        error: 'Seed failed', 
        details: error instanceof Error ? error.message : String(error),
        fullError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
      });
    }
  });

  app.put('/api/todos/reorder', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    if (isMockMode) {
      // Update positions in mock data
      ids.forEach((id, index) => {
        const todo = mockData.todos.find(t => t.id === Number(id));
        if (todo) todo.position = index;
      });
      return res.json({ success: true });
    }

    try {
      // In PostgreSQL with Drizzle, we can use a transaction for reordering
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx.update(todos)
            .set({ position: i })
            .where(eq(todos.id, ids[i]));
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to reorder todos:', error);
      res.status(500).json({ error: 'Failed to reorder todos' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
