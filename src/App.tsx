/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  Circle,
  Loader2,
  CheckSquare,
  Calendar,
  Target,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Settings,
  Bell,
  Search,
  User,
  FolderKanban,
  Layout,
  Edit2,
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
}

interface Todo {
  id: number;
  text: string;
  completed: number;
  position: number;
  project_id: number | null;
  due_date: string | null;
}

// --- Components ---

function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xl transition-transform group-hover:scale-105">
              LT
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900">Life Thomas</span>
          </Link>
          
          <nav className="hidden md:flex items-center ml-8 gap-1">
            <Link 
              to="/" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isHome ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Dashboard
            </Link>
            <Link 
              to="/hoje" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname === '/hoje' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Hoje
            </Link>
            <Link 
              to="/checklist" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname === '/checklist' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Checklist
            </Link>
            <Link 
              to="/projects" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname.startsWith('/projects') ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Projetos
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 overflow-hidden">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}

function SortableTodoItem({ 
  todo, 
  onToggle, 
  onDelete,
  onUpdate,
  projects = []
}: { 
  key?: any;
  todo: Todo; 
  onToggle: (id: number, completed: boolean) => void | Promise<void>; 
  onDelete: (id: number) => void | Promise<void>;
  onUpdate: (id: number, updates: Partial<Todo>) => void | Promise<void>;
  projects?: Project[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDate, setEditDate] = useState(todo.due_date || '');
  const [editProjectId, setEditProjectId] = useState<number | null>(todo.project_id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const project = projects.find(p => p.id === todo.project_id);

  const handleSave = async () => {
    await onUpdate(todo.id, {
      text: editText,
      due_date: editDate || null,
      project_id: editProjectId
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditDate(todo.due_date || '');
    setEditProjectId(todo.project_id);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg transition-all",
        isDragging && "z-50 shadow-xl opacity-90 scale-[1.01] border-zinc-400",
        !isDragging && "hover:border-zinc-300",
        isEditing && "ring-2 ring-zinc-900 border-transparent"
      )}
    >
      {!isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <GripVertical size={16} />
        </button>
      )}

      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        disabled={isEditing}
        className={cn(
          "transition-all duration-200",
          todo.completed ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-400",
          isEditing && "opacity-50 cursor-not-allowed"
        )}
      >
        {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      <div className="flex-1 flex flex-col min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm bg-zinc-50 border-none focus:ring-0 p-0 text-zinc-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-zinc-100 rounded px-1.5 py-0.5">
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 text-zinc-600 p-0"
                />
                {editDate && (
                  <button 
                    onClick={() => setEditDate('')}
                    className="ml-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <select
                value={editProjectId || ''}
                onChange={(e) => setEditProjectId(e.target.value ? Number(e.target.value) : null)}
                className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 rounded px-1.5 py-0.5 border-none focus:ring-0 text-zinc-600"
              >
                <option value="">Sem Projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div 
            className="cursor-pointer" 
            onClick={() => setIsEditing(true)}
          >
            <span className={cn(
              "text-sm transition-all truncate block",
              todo.completed ? "text-zinc-400 line-through" : "text-zinc-700"
            )}>
              {todo.text}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {project && (
                <span 
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: project.color }}
                >
                  {project.name}
                </span>
              )}
              {todo.due_date && (
                <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(todo.due_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-all"
              title="Salvar"
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded transition-all"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-all"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Pages ---

function Dashboard() {
  const cards = [
    { 
      id: 'hoje', 
      title: 'Hoje', 
      icon: Calendar, 
      color: 'text-emerald-500',
      path: '/hoje',
      description: 'O que você precisa focar agora.'
    },
    { 
      id: 'checklist', 
      title: 'Checklist', 
      icon: CheckSquare, 
      color: 'text-blue-500',
      path: '/checklist',
      description: 'Todas as suas tarefas pendentes.'
    },
    { 
      id: 'projects', 
      title: 'Projetos', 
      icon: FolderKanban, 
      color: 'text-purple-500',
      path: '/projects',
      description: 'Organize suas tarefas por projeto.'
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-24 px-4 sm:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {cards.map((card) => (
          <Link 
            key={card.id}
            to={card.path}
            className="vercel-card block p-6 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-md bg-zinc-50 border border-zinc-100", card.color)}>
                <card.icon size={20} />
              </div>
              <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">{card.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName.trim(),
          color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)]
        }),
      });
      const newProject = await response.json();
      setProjects([...projects, newProject]);
      setNewName('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Projetos</h1>
          <p className="text-zinc-500 text-sm mt-1">Gerencie seus grandes objetivos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="vercel-button-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Projeto
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="vercel-card p-6 mb-8"
          >
            <form onSubmit={handleAddProject} className="flex gap-4">
              <input 
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do projeto..."
                className="flex-1 notion-input border-b border-zinc-200 focus:border-black transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="vercel-button-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="vercel-button-primary"
                >
                  Criar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-zinc-400" size={32} />
          </div>
        ) : projects.map((project) => (
          <Link 
            key={project.id}
            to={`/projects/${project.id}`}
            className="vercel-card p-6 group relative"
          >
            <div 
              className="w-1 h-12 absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
              style={{ backgroundColor: project.color }}
            />
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900">{project.name}</h3>
              <button 
                onClick={(e) => handleDeleteProject(project.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2">{project.description || 'Sem descrição.'}</p>
            <div className="mt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <span>Ver Tarefas</span>
              <ChevronRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProjectDetail() {
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

function Hoje() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/todos'),
        fetch('/api/projects')
      ]);
      setTodos(await tRes.json());
      setProjects(await pRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleUpdateTodo = async (id: number, updates: Partial<Todo>) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
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

function Checklist() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'nodate' | 'completed'>('pending');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/todos'),
        fetch('/api/projects')
      ]);
      setTodos(await tRes.json());
      setProjects(await pRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputValue.trim(),
          project_id: selectedProjectId,
          due_date: selectedDate
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

  const handleToggleTodo = async (id: number, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleUpdateTodo = async (id: number, updates: Partial<Todo>) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updatedTodo = await response.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
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

  const filteredTodos = todos.filter(t => {
    if (activeFilter === 'pending') return !t.completed;
    if (activeFilter === 'nodate') return !t.completed && !t.due_date;
    if (activeFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Checklist</h1>
            <p className="text-zinc-500 text-xs">Gerencie todas as suas tarefas.</p>
          </div>
        </div>

        <div className="flex items-center bg-zinc-100 p-1 rounded-lg">
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
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                activeFilter === tab.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <form onSubmit={handleAddTodo} className="flex gap-2 w-full max-w-2xl">
          <div className="flex-1 flex items-center bg-zinc-50 border border-zinc-200 rounded-md px-3 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
            <Plus size={16} className="text-zinc-400 mr-2" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Adicionar nova tarefa..."
              className="notion-input"
            />
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 ml-2">
              <div className="flex items-center">
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
              <select 
                className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 text-zinc-400 cursor-pointer hover:text-zinc-900 transition-colors"
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sem Projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p className="text-sm">Sincronizando...</p>
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
              <div className="flex flex-col flex-wrap gap-3 h-full content-start items-start">
                <AnimatePresence initial={false}>
                  {filteredTodos.map((todo) => (
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
                        projects={projects}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredTodos.length === 0 && (
                  <div className="flex items-center justify-center h-full border-2 border-dashed border-zinc-100 rounded-xl w-80">
                    <p className="text-zinc-400 text-sm px-6 text-center">Nenhuma tarefa encontrada.</p>
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hoje" element={<Hoje />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}




