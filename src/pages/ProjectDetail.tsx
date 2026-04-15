import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Project, Todo } from '../types';
import { SortableTodoItem } from '../components/todo/SortableTodoItem';

import { api } from '../services/api';
import { useAgentStore } from '../store/useAgentStore';

export function ProjectDetail() {
  const { id } = useParams();
  const { switchContext, notifyChange } = useAgentStore();
  const [project, setProject] = useState<Project | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist'>('checklist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [projectsData, todosData] = await Promise.all([
        api.projects.getAll(),
        api.todos.getAll({ projectId: Number(id) })
      ]);
      const projectData = projectsData.find((p: Project) => p.id === Number(id));
      setProject(projectData || null);
      setTodos(Array.isArray(todosData) ? todosData : []);
      
      // Switch agent context to this project
      if (id) {
        switchContext('project', Number(id));
      }
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  }, [id, switchContext]);

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
        projectId: Number(id),
        dueDate: selectedDate || null
      });
      setTodos([...todos, newTodo]);
      setInputValue('');
      notifyChange(`Nova tarefa "${newTodo.text}" adicionada ao projeto ${project?.name}.`);
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError(error instanceof Error ? error.message : 'Falha ao adicionar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTodo = async (todoId: number, completed: boolean) => {
    try {
      const updatedTodo = await api.todos.update(todoId, { completed });
      setTodos(todos.map(t => t.id === todoId ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleUpdateTodo = async (todoId: number, updates: Partial<Todo>) => {
    try {
      const updatedTodo = await api.todos.update(todoId, updates);
      setTodos(todos.map(t => t.id === todoId ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await api.todos.delete(todoId);
      const deletedTodo = todos.find(t => t.id === todoId);
      setTodos(todos.filter(t => t.id !== todoId));
      if (deletedTodo) {
        notifyChange(`Tarefa "${deletedTodo.text}" removida. Consciência atualizada.`);
      }
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

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;
  if (!project) return <div className="text-center py-24">Projeto não encontrado.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="p-2 text-app-text-dim hover:text-app-fg hover:bg-app-card rounded-xl transition-all border border-app-border"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || 'var(--app-accent)' }} />
              <h1 className="text-3xl font-bold tracking-tight text-app-fg uppercase">{project.name}</h1>
            </div>
            <p className="text-app-text-dim text-sm font-medium mt-1">{project.description || 'Gerenciamento de projeto ativo.'}</p>
          </div>
        </div>

        <div className="flex items-center bg-app-card p-1 rounded-xl border border-app-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
              activeTab === 'overview' 
                ? "bg-app-accent text-app-bg shadow-glow-accent" 
                : "text-app-text-dim hover:text-app-fg hover:bg-app-border/50"
            )}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={cn(
              "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
              activeTab === 'checklist' 
                ? "bg-app-accent text-app-bg shadow-glow-accent" 
                : "text-app-text-dim hover:text-app-fg hover:bg-app-border/50"
            )}
          >
            Checklist
          </button>
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

      {activeTab === 'checklist' && (
        <div className="max-w-4xl mx-auto w-full">
          <form onSubmit={handleAddTodo} className="group">
            <div className="flex flex-col md:flex-row gap-3 w-full bg-app-card border border-app-border rounded-2xl p-3 shadow-sm focus-within:border-app-accent/50 transition-all">
              <div className="flex-1 flex items-center px-2">
                <Plus size={18} className="text-app-accent mr-3" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Adicionar nova tarefa neste projeto..."
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

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSubmitting}
                  className="bg-app-accent text-app-bg px-8 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "ADICIONAR"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="pt-4">
        {activeTab === 'checklist' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={todos.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence initial={false}>
                  {todos.map((todo) => (
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
                        projects={[project]}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {todos.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-app-border rounded-3xl bg-app-card/20">
                    <p className="text-app-text-dim text-sm font-medium">Nenhuma tarefa encontrada para este projeto.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="max-w-4xl mx-auto w-full bg-app-card border border-app-border rounded-3xl p-10 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-app-fg uppercase mb-8">Informações do Projeto</h2>
            <div className="space-y-10">
              <div className="relative pl-6 border-l-2 border-app-accent/30">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-accent mb-3">Descrição</h3>
                <p className="text-app-fg text-lg leading-relaxed font-medium">
                  {project.description || 'Nenhuma descrição detalhada disponível.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-app-bg/50 p-6 rounded-2xl border border-app-border">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-text-dim mb-4">Status</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-app-fg uppercase tracking-widest">Ativo</span>
                  </div>
                </div>
                
                <div className="bg-app-bg/50 p-6 rounded-2xl border border-app-border">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-text-dim mb-4">Tarefas</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-app-fg">{todos.length}</span>
                    <span className="text-[10px] font-bold text-app-text-dim uppercase tracking-widest">Total</span>
                  </div>
                </div>

                <div className="bg-app-bg/50 p-6 rounded-2xl border border-app-border">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-text-dim mb-4">Prioridade</h3>
                  <span className="text-sm font-bold text-app-accent uppercase tracking-widest">Alta</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
