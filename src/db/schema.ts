import { pgTable, serial, text, integer, timestamp, boolean, jsonb, customType } from 'drizzle-orm/pg-core';

// Custom type for pgvector support
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
});

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

export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'system', 'project', 'task'
  parentId: integer('parent_id'), // Hierarchical link
  linkedId: integer('linked_id'), // Link to project_id or task_id
  description: text('description'),
  persona: text('persona'),
  scope: text('scope'),
  goals: text('goals'),
  instructions: text('instructions'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const agentMemories = pgTable('agent_memories', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});
