import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  Loader2, 
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

export function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist'>('checklist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/projects'),
        fetch(`/api/todos?projectId=${id}`)
      ]);
      const projects = await pRes.json();
      const projectData = projects.find((p: Project) => p.id === Number(id));
      setProject(projectData);
      setTodos(await tRes.json());
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputValue.trim(), 
          project_id: Number(id),
          due_date: selectedDate || null
        }),
      });
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setInputValue('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTodo = async (todoId: number, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === todoId ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleUpdateTodo = async (todoId: number, updates: Partial<Todo>) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === todoId ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await fetch(`/api/todos/${todoId}`, { method: 'DELETE' });
      setTodos(todos.filter(t => t.id !== todoId));
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
        await fetch('/api/todos/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: newTodos.map(t => t.id) }),
        });
      } catch (error) {
        console.error('Failed to save order:', error);
        fetchData();
      }
    }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;
  if (!project) return <div className="text-center py-24">Projeto não encontrado.</div>;

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{project.name}</h1>
            </div>
            <p className="text-zinc-500 text-xs">{project.description || 'Gerencie seu projeto.'}</p>
          </div>
        </div>

        <div className="flex items-center bg-zinc-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
              activeTab === 'overview' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
              activeTab === 'checklist' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            Checklist
          </button>
        </div>
      </div>

      {activeTab === 'checklist' && (
        <div className="mb-6">
          <form onSubmit={handleAddTodo} className="flex gap-2 w-full max-w-2xl">
            <div className="flex-1 flex items-center bg-zinc-50 border border-zinc-200 rounded-md px-3 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
              <Plus size={16} className="text-zinc-400 mr-2" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Adicionar tarefa ao projeto..."
                className="notion-input"
              />
              <div className="flex items-center ml-2 border-l border-zinc-200 pl-3">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 text-zinc-400 cursor-pointer hover:text-zinc-900 transition-colors"
                />
                {selectedDate && (
                  <button 
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="ml-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="vercel-button-primary min-w-[80px] flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Add"}
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
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
              <div className="flex flex-col flex-wrap gap-3 h-full content-start items-start">
                <AnimatePresence initial={false}>
                  {todos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      layout
                      className="w-80 shrink-0"
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
                  <div className="flex items-center justify-center h-full border-2 border-dashed border-zinc-100 rounded-xl w-80">
                    <p className="text-zinc-400 text-sm px-6 text-center">Nenhuma tarefa neste projeto.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="h-full bg-white border border-zinc-200 rounded-xl p-8 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Sobre o Projeto</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Descrição</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  {project.description || 'Sem descrição definida para este projeto.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Status</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-zinc-900">Ativo</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Total de Tarefas</h3>
                  <span className="text-sm font-medium text-zinc-900">{todos.length} itens</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
