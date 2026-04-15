import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Todo, Project } from '../types';
import { SortableTodoItem } from '../components/todo/SortableTodoItem';

import { api } from '../services/api';
import { useAgentStore } from '../store/useAgentStore';

export function Hoje() {
  const { notifyChange } = useAgentStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [todosData, projectsData] = await Promise.all([
        api.todos.getAll(),
        api.projects.getAll()
      ]);
      setTodos(Array.isArray(todosData) ? todosData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setTodos([]);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTodo = async (id: number, completed: boolean) => {
    try {
      const updatedTodo = await api.todos.update(id, { completed });
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleUpdateTodo = async (id: number, updates: Partial<Todo>) => {
    try {
      const updatedTodo = await api.todos.update(id, updates);
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await api.todos.delete(id);
      const deletedTodo = todos.find(t => t.id === id);
      setTodos(todos.filter(t => t.id !== id));
      if (deletedTodo) {
        notifyChange(`Tarefa "${deletedTodo.text}" arquivada. Consciência sincronizada.`);
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // Filter for uncompleted tasks due today or overdue
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const activeTodos = todos.filter(t => {
    if (t.completed) return false;
    if (!t.dueDate) return false;
    return t.dueDate <= today;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-app-fg tracking-tight uppercase">Foco Operacional</h1>
          <p className="text-app-text-dim mt-1 text-sm font-medium">Tarefas críticas para hoje.</p>
        </div>
        <div className="flex items-center gap-2 bg-app-card px-4 py-2 rounded-xl border border-app-border">
          <div className="w-2 h-2 rounded-full bg-app-accent animate-pulse" />
          <span className="text-[10px] font-bold text-app-fg uppercase tracking-widest">Sincronização Ativa</span>
        </div>
      </header>

      <div className="pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-app-text-dim">
            <Loader2 className="animate-spin mb-4 text-app-accent" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest">Processando Prioridades...</p>
          </div>
        ) : activeTodos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTodos.map((todo) => (
              <SortableTodoItem 
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onUpdate={handleUpdateTodo}
                projects={projects}
              />
            ))}
          </div>
        ) : (
          <div className="p-20 flex flex-col items-center justify-center text-center bg-app-card/20 border-2 border-dashed border-app-border rounded-3xl">
            <div className="text-app-text-dim text-lg italic font-serif max-w-md">
              "Todas as tarefas do dia foram cumpridas com precisão."
            </div>
            <div className="mt-8 text-[10px] font-bold uppercase tracking-[0.4em] text-app-accent">
              Sistema em Estado de Prontidão
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
