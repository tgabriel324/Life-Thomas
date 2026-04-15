import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  Loader2, 
  Calendar,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '../lib/utils';
import { Todo, Project } from '../types';
import { SortableTodoItem } from '../components/todo/SortableTodoItem';
import { api } from '../services/api';

export function Checklist() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'nodate' | 'completed'>('pending');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTodo = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const newTodo = await api.todos.create({ 
        text: inputValue.trim(),
        projectId: selectedProjectId,
        dueDate: selectedDate
      });
      setTodos([...todos, newTodo]);
      setInputValue('');
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError(error instanceof Error ? error.message : 'Falha ao adicionar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id as number;
      const overId = over.id as number;
      
      const oldIndex = todos.findIndex((t) => t.id === activeId);
      const newIndex = todos.findIndex((t) => t.id === overId);

      const newTodos: Todo[] = arrayMove(todos, oldIndex, newIndex);
      setTodos(newTodos);

      try {
        await api.todos.reorder(newTodos.map(t => t.id));
      } catch (error) {
        console.error('Failed to save order:', error);
        fetchData();
      }
    }
  };

  const filteredTodos = todos.filter(t => {
    if (activeFilter === 'pending') return !t.completed;
    if (activeFilter === 'nodate') return !t.completed && !t.dueDate;
    if (activeFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-app-fg tracking-tight uppercase">Checklist</h1>
          <p className="text-app-text-dim text-sm font-medium mt-1">Gerencie todas as suas tarefas pendentes.</p>
        </div>

        <div className="flex items-center bg-app-card p-1 rounded-xl border border-app-border">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'nodate', label: 'Sem Data' },
            { id: 'completed', label: 'Concluídas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                activeFilter === tab.id 
                  ? "bg-app-accent text-app-bg shadow-glow-accent" 
                  : "text-app-text-dim hover:text-app-fg hover:bg-app-border/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto w-full">
        <form onSubmit={handleAddTodo} className="group">
          <div className="flex flex-col md:flex-row gap-3 w-full bg-app-card border border-app-border rounded-2xl p-3 shadow-sm focus-within:border-app-accent/50 transition-all">
            <div className="flex-1 flex items-center px-2">
              <Plus size={18} className="text-app-accent mr-3" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Adicionar nova tarefa..."
                className="w-full bg-transparent border-none focus:ring-0 text-app-fg placeholder:text-app-fg/30 text-sm font-medium"
              />
            </div>
            
            <div className="flex items-center gap-3 px-2 border-t md:border-t-0 md:border-l border-app-border pt-3 md:pt-0">
              <div className="flex items-center bg-app-bg/50 rounded-xl px-3 py-2 border border-app-border/50">
                <Calendar size={14} className="text-app-accent mr-2" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 text-app-fg cursor-pointer p-0"
                />
                {selectedDate && (
                  <button 
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="ml-2 text-app-text-dim hover:text-app-fg"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              
              <select 
                className="text-[10px] font-bold uppercase tracking-widest bg-app-bg/50 rounded-xl px-3 py-2 border border-app-border/50 focus:ring-0 text-app-fg cursor-pointer transition-all"
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sem Projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!inputValue.trim() || isSubmitting}
                className="bg-app-accent text-app-bg px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "ADICIONAR"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-app-text-dim">
            <Loader2 size={32} className="animate-spin mb-4 text-app-accent" />
            <p className="text-xs font-bold uppercase tracking-widest">Carregando tarefas...</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTodos.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence initial={false}>
                  {filteredTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <SortableTodoItem
                        todo={todo}
                        onToggle={handleToggleTodo}
                        onDelete={handleDeleteTodo}
                        onUpdate={handleUpdateTodo}
                        projects={projects}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredTodos.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-app-border rounded-3xl bg-app-card/20">
                    <p className="text-app-text-dim text-sm font-medium">Nenhuma tarefa encontrada.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
