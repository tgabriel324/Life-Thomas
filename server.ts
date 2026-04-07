import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database setup
  const db = new Database('todos.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      position INTEGER NOT NULL
    )
  `);

  app.use(express.json());

  // API Routes
  app.get('/api/todos', (req, res) => {
    try {
      const todos = db.prepare('SELECT * FROM todos ORDER BY position ASC').all();
      res.json(todos);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch todos' });
    }
  });

  app.post('/api/todos', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    try {
      // Get max position
      const maxPosResult = db.prepare('SELECT MAX(position) as maxPos FROM todos').get() as { maxPos: number | null };
      const nextPos = (maxPosResult.maxPos ?? -1) + 1;

      const info = db.prepare('INSERT INTO todos (text, position) VALUES (?, ?)').run(text, nextPos);
      const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newTodo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create todo' });
    }
  });

  app.patch('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const { text, completed } = req.body;

    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (text !== undefined) {
        updates.push('text = ?');
        params.push(text);
      }
      if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);
      }

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

      params.push(id);
      const result = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      
      if (result.changes === 0) return res.status(404).json({ error: 'Todo not found' });
      
      const updatedTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
      res.json(updatedTodo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update todo' });
    }
  });

  app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    try {
      const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
      if (result.changes === 0) return res.status(404).json({ error: 'Todo not found' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete todo' });
    }
  });

  app.put('/api/todos/reorder', (req, res) => {
    const { ids } = req.body; // Array of IDs in new order
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    try {
      const updateStmt = db.prepare('UPDATE todos SET position = ? WHERE id = ?');
      const transaction = db.transaction((todoIds) => {
        for (let i = 0; i < todoIds.length; i++) {
          updateStmt.run(i, todoIds[i]);
        }
      });
      transaction(ids);
      res.json({ success: true });
    } catch (error) {
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
