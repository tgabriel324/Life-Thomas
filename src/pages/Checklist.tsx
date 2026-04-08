import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'nodate' | 'completed'>('pending');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [todosData, projectsData] = await Promise.all([
        api.todos.getAll(),
        api.projects.getAll()
      ]);
      setTodos(todosData);
      setProjects(projectsData);
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
      const newTodo = await api.todos.create({ 
        text: inputValue.trim(),
        project_id: selectedProjectId,
        due_date: selectedDate
      });
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
