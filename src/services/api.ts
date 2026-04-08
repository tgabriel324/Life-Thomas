import { Todo, Project } from '../types';

const API_BASE = '/api';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detail = errorData.details ? ` (${errorData.details})` : '';
    throw new Error(errorData.error ? `${errorData.error}${detail}` : `API request failed with status ${res.status}`);
  }
  return res.json();
};

export const api = {
  todos: {
    getAll: (projectId?: string): Promise<Todo[]> => 
      fetch(`${API_BASE}/todos${projectId ? `?projectId=${projectId}` : ''}`).then(handleResponse),
    
    create: (data: { text: string; project_id?: number | null; due_date?: string | null }): Promise<Todo> =>
      fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    
    update: (id: number, updates: Partial<Todo>): Promise<Todo> =>
      fetch(`${API_BASE}/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(handleResponse),
    
    delete: (id: number): Promise<void> =>
      fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete todo');
      }),
    
    reorder: (ids: number[]): Promise<void> =>
      fetch(`${API_BASE}/todos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to reorder todos');
      }),
  },
  
  projects: {
    getAll: (): Promise<Project[]> => 
      fetch(`${API_BASE}/projects`).then(handleResponse),
    
    create: (data: { name: string; description?: string; color?: string }): Promise<Project> =>
      fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    
    delete: (id: number): Promise<void> =>
      fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete project');
      }),
  }
};
