import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Todo, Project } from '../types';
import { SortableTodoItem } from '../components/todo/SortableTodoItem';

import { api } from '../services/api';

export function Hoje() {
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
      const updatedTodo = await api.todos.update(id, { completed: completed ? 1 : 0 });
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
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // Filter for uncompleted tasks due today or overdue
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const activeTodos = todos.filter(t => {
    if (t.completed) return false;
    if (!t.due_date) return false;
    return t.due_date <= today;
  });

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Hoje</h1>
        <p className="text-zinc-500 mt-1">Foco nas tarefas pendentes.</p>
      </header>

      <div className="vercel-card p-8">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>
          ) : activeTodos.map((todo) => (
            <SortableTodoItem 
              key={todo.id}
              todo={todo}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
              onUpdate={handleUpdateTodo}
              projects={projects}
            />
          ))}
          {!isLoading && activeTodos.length === 0 && (
            <div className="text-center py-12 text-zinc-400 text-sm">
              Tudo limpo por hoje! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
