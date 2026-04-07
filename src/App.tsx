/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, FormEvent } from 'react';
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
  User
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
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Todo {
  id: number;
  text: string;
  completed: number;
  position: number;
}

// --- Components ---

function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-bottom border-zinc-200">
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
              to="/checklist" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname === '/checklist' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Checklist
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
  onDelete 
}: { 
  todo: Todo; 
  onToggle: (id: number, completed: boolean) => void; 
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg transition-all",
        isDragging && "z-50 shadow-xl opacity-90 scale-[1.01] border-zinc-400",
        !isDragging && "hover:border-zinc-300"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-zinc-300 hover:text-zinc-500 transition-colors"
      >
        <GripVertical size={16} />
      </button>

      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        className={cn(
          "transition-all duration-200",
          todo.completed ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-400"
        )}
      >
        {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      <span className={cn(
        "flex-1 text-sm transition-all",
        todo.completed ? "text-zinc-400 line-through" : "text-zinc-700"
      )}>
        {todo.text}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// --- Pages ---

function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto py-24 px-4 sm:px-6 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link 
          to="/checklist"
          className="vercel-card block p-6 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-md bg-zinc-50 border border-zinc-100 text-blue-500">
              <CheckSquare size={20} />
            </div>
            <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Checklist</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">Manage your daily tasks and reorder them.</p>
        </Link>
      </motion.div>
    </div>
  );
}

function Checklist() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchTodos = useCallback(async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

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
        body: JSON.stringify({ text: inputValue.trim() }),
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
        fetchTodos();
      }
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Checklist</h1>
            <p className="text-zinc-500 text-xs">Manage your tasks efficiently across columns.</p>
          </div>
        </div>

        <form onSubmit={handleAddTodo} className="flex gap-2 w-full max-w-md">
          <div className="flex-1 flex items-center bg-zinc-50 border border-zinc-200 rounded-md px-3 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
            <Plus size={16} className="text-zinc-400 mr-2" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add a new task..."
              className="notion-input"
            />
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
            <p className="text-sm">Syncing with database...</p>
          </div>
        ) : (
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
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}

        {!isLoading && todos.length === 0 && (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-zinc-100 rounded-xl mx-auto max-w-md">
            <p className="text-zinc-400 text-sm">No tasks found. Start by adding one above.</p>
          </div>
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
            <Route path="/checklist" element={<Checklist />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}



