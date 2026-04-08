import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#000000'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').default(false),
  position: integer('position').notNull(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  dueDate: text('due_date'), // Keeping as text for ISO strings as per previous implementation
  createdAt: timestamp('created_at').defaultNow(),
});
