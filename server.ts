import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index';
import { projects, todos } from './src/db/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Project Routes ---
  app.get('/api/projects', async (req, res) => {
    try {
      const allProjects = await db.select().from(projects);
      res.json(allProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
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
      console.error('Failed to create project:', error);
      res.status(500).json({ error: 'Failed to create project' });
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
      console.error('Failed to fetch todos:', error);
      res.status(500).json({ error: 'Failed to fetch todos' });
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
      console.error('Failed to create todo:', error);
      res.status(500).json({ error: 'Failed to create todo' });
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
