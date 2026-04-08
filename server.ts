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
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is missing from environment variables!');
  } else {
    console.log('🔗 DATABASE_URL is present.');
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
      res.json({ success: true, message: 'Database tables ensured.' });
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
      await db.delete(projects).where(eq(projects.id, Number(id)));
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
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
      const result = await db.delete(todos).where(eq(todos.id, Number(id))).returning();
      if (result.length === 0) return res.status(404).json({ error: 'Todo not found' });
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      res.status(500).json({ error: 'Failed to delete todo' });
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
