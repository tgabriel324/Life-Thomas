import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

import { api } from '../services/api';

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const data = await api.projects.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
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
      const newProject = await api.projects.create({ 
        name: newName.trim(),
        color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)]
      });
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
      await api.projects.delete(id);
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
