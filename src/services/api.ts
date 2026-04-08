import { Todo, Project } from '../types';

const API_BASE = '/api';

export const api = {
  todos: {
    getAll: (projectId?: string): Promise<Todo[]> => 
      fetch(`${API_BASE}/todos${projectId ? `?projectId=${projectId}` : ''}`).then(res => res.json()),
    
    create: (data: { text: string; project_id?: number | null; due_date?: string | null }): Promise<Todo> =>
      fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    
    update: (id: number, updates: Partial<Todo>): Promise<Todo> =>
      fetch(`${API_BASE}/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(res => res.json()),
    
    delete: (id: number): Promise<void> =>
      fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' }).then(() => {}),
    
    reorder: (ids: number[]): Promise<void> =>
      fetch(`${API_BASE}/todos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).then(() => {}),
  },
  
  projects: {
    getAll: (): Promise<Project[]> => 
      fetch(`${API_BASE}/projects`).then(res => res.json()),
    
    create: (data: { name: string; description?: string; color?: string }): Promise<Project> =>
      fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    
    delete: (id: number): Promise<void> =>
      fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' }).then(() => {}),
  }
};
