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

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  specialty: text('specialty'),
  email: text('email'),
  whatsapp: text('whatsapp'),
  avatar: text('avatar'),
  status: text('status').default('available'), // 'available', 'focused', 'busy'
  createdAt: timestamp('created_at').defaultNow(),
});

export const objectives = pgTable('objectives', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('active'), // 'active', 'completed', 'on_hold'
  createdAt: timestamp('created_at').defaultNow(),
});

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  objectiveId: integer('objective_id').references(() => objectives.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  targetValue: text('target_value'),
  currentValue: text('current_value').default('0'),
  deadline: text('deadline'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').default(false),
  position: integer('position').notNull(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  dueDate: text('due_date'),
  priority: text('priority').default('medium'), // 'low', 'medium', 'high', 'critical'
  assignedTo: integer('assigned_to').references(() => teamMembers.id, { onDelete: 'set null' }),
  goalId: integer('goal_id').references(() => goals.id, { onDelete: 'set null' }),
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

export const todoAttachments = pgTable('todo_attachments', {
  id: serial('id').primaryKey(),
  todoId: integer('todo_id').references(() => todos.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'audio', 'image', 'document', 'link', 'repo', 'code', etc.
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').default('#3B82F6'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const todoTags = pgTable('todo_tags', {
  id: serial('id').primaryKey(),
  todoId: integer('todo_id').references(() => todos.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
});
