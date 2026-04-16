import { Todo, Project, TeamMember, Objective, Goal, Tag } from '../types';

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
    getAll: (filters?: { projectId?: number; assignedTo?: number; goalId?: number }): Promise<Todo[]> => {
      const params = new URLSearchParams();
      if (filters?.projectId) params.append('projectId', filters.projectId.toString());
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo.toString());
      if (filters?.goalId) params.append('goalId', filters.goalId.toString());
      const query = params.toString();
      return fetch(`${API_BASE}/todos${query ? `?${query}` : ''}`).then(handleResponse);
    },
    
    create: (data: { text: string; projectId?: number | null; dueDate?: string | null; priority?: string; assignedTo?: number | null; goalId?: number | null; tagIds?: number[] }): Promise<Todo> =>
      fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    
    update: (id: number, updates: Partial<Todo> & { tagIds?: number[] }): Promise<Todo> =>
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

    getAttachments: (id: number): Promise<any[]> =>
      fetch(`${API_BASE}/todos/${id}/attachments`).then(handleResponse),

    addAttachment: (id: number, data: { type: string; content: string; metadata?: any }): Promise<any> =>
      fetch(`${API_BASE}/todos/${id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    deleteAttachment: (id: number): Promise<void> =>
      fetch(`${API_BASE}/attachments/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete attachment');
      }),

    seed: (): Promise<any> =>
      fetch(`${API_BASE}/seed`, { method: 'POST' }).then(handleResponse),
  },

  tags: {
    getAll: (): Promise<Tag[]> =>
      fetch(`${API_BASE}/tags`).then(handleResponse),
    create: (data: { name: string; color?: string }): Promise<Tag> =>
      fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: number): Promise<void> =>
      fetch(`${API_BASE}/tags/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete tag');
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
  },

  team: {
    getAll: (): Promise<TeamMember[]> =>
      fetch(`${API_BASE}/team`).then(handleResponse),
    create: (data: Partial<TeamMember>): Promise<TeamMember> =>
      fetch(`${API_BASE}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    update: (id: number, data: Partial<TeamMember>): Promise<TeamMember> =>
      fetch(`${API_BASE}/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    delete: (id: number): Promise<void> =>
      fetch(`${API_BASE}/team/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete team member');
      }),
  },

  strategy: {
    getObjectives: (): Promise<Objective[]> =>
      fetch(`${API_BASE}/objectives`).then(handleResponse),
    createObjective: (data: Partial<Objective>): Promise<Objective> =>
      fetch(`${API_BASE}/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    updateObjective: (id: number, data: Partial<Objective>): Promise<Objective> =>
      fetch(`${API_BASE}/objectives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    deleteObjective: (id: number): Promise<void> =>
      fetch(`${API_BASE}/objectives/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete objective');
      }),
    getGoals: (): Promise<Goal[]> =>
      fetch(`${API_BASE}/goals`).then(handleResponse),
    createGoal: (data: Partial<Goal>): Promise<Goal> =>
      fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    updateGoal: (id: number, data: Partial<Goal>): Promise<Goal> =>
      fetch(`${API_BASE}/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),
    deleteGoal: (id: number): Promise<void> =>
      fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok) throw new Error('Failed to delete goal');
      }),
  }
};
