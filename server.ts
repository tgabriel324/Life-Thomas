import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, pool } from './src/db/index.ts';
import { projects, todos } from './src/db/schema.ts';
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
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined.');
    }
    const client = await pool.connect();
    console.log('✅ Database connection established successfully.');
    client.release();
  } catch (error) {
    console.error('❌ CRITICAL DATABASE ERROR:', error instanceof Error ? error.message : String(error));
    console.error('👉 The application will likely fail. Please check your DATABASE_URL in Settings > Secrets.');
  }

  // --- Auto-Migration ---
  try {
    const migrationsPath = path.join(process.cwd(), 'drizzle');
    console.log(`🔄 Running database migrations from: ${migrationsPath}`);
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  app.use(express.json());

  // --- Health Check ---
  app.get('/api/health', async (req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        database: 'disconnected', 
        message: error instanceof Error ? error.message : String(error),
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
      `);
      res.json({ success: true, message: 'Database tables and extensions ensured.' });
    } catch (error) {
      console.error('❌ Manual setup failed:', error);
      res.status(500).json({ error: 'Manual setup failed', details: String(error) });
    }
  });

  // --- Project Routes ---
  app.get('/api/projects', async (req, res) => {
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

  // --- Todo Routes ---
  app.get('/api/todos', async (req, res) => {
    try {
      const { projectId } = req.query;
      let query = db.select().from(todos).orderBy(asc(todos.position));
      
      if (projectId) {
        const allTodos = await db.select().from(todos)
          .where(eq(todos.projectId, Number(projectId)))
          .orderBy(asc(todos.position));
        return res.json(allTodos);
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
    const { text, project_id, due_date } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    try {
      // Get max position
      const [maxPosResult] = await db.select({ 
        maxPos: sql<number>`max(${todos.position})` 
      }).from(todos);
      
      const nextPos = (maxPosResult?.maxPos ?? -1) + 1;

      const [newTodo] = await db.insert(todos).values({
        text,
        position: nextPos,
        projectId: project_id || null,
        dueDate: due_date || null,
        completed: false
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
    const { text, completed, project_id, due_date } = req.body;

    try {
      const updates: any = {};
      if (text !== undefined) updates.text = text;
      if (completed !== undefined) updates.completed = !!completed;
      if (project_id !== undefined) updates.projectId = project_id;
      if (due_date !== undefined) updates.dueDate = due_date;

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

  app.put('/api/todos/reorder', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

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
