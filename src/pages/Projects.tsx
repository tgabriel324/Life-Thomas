import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

import { api } from '../services/api';
import { useAgentStore } from '../store/useAgentStore';

export function Projects() {
  const { switchContext, notifyChange } = useAgentStore();
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
    switchContext('system');
  }, [switchContext]);

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
      notifyChange(`Novo projeto "${newProject.name}" detectado. Consciência sincronizada.`);
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.projects.delete(id);
      const deletedProject = projects.find(p => p.id === id);
      setProjects(projects.filter(p => p.id !== id));
      if (deletedProject) {
        notifyChange(`Projeto "${deletedProject.name}" removido. Reajustando escopo.`);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleFixDatabase = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/setup-db', { method: 'POST' });
      await fetchProjects();
    } catch (error) {
      console.error('Failed to fix database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-12 border-b border-app-border pb-8">
        <div>
          <h1 className="text-3xl font-display font-black text-app-fg tracking-tighter">PROJETOS ESTRATÉGICOS</h1>
          <p className="text-app-text-dim text-sm mt-1">Gerencie os grandes pilares do seu império.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleFixDatabase}
            className="btn-elite text-[10px] py-2 px-4"
          >
            Sincronizar DB
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-elite flex items-center gap-2 bg-app-accent text-white border-none"
          >
            <Plus size={18} />
            Novo Projeto
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bento-grid-item p-8 mb-12"
          >
            <form onSubmit={handleAddProject} className="flex flex-col sm:flex-row gap-6">
              <input 
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do projeto..."
                className="flex-1 input-elite"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="btn-elite"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-elite bg-app-accent text-white border-none"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="animate-spin text-app-accent" size={48} />
          </div>
        ) : projects.map((project) => (
          <Link 
            key={project.id}
            to={`/projects/${project.id}`}
            className="bento-grid-item p-8 group relative"
          >
            <div 
              className="w-1.5 h-12 absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full shadow-glow-accent"
              style={{ backgroundColor: project.color || 'var(--app-accent)' }}
            />
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-2xl font-display font-bold text-app-fg group-hover:text-app-accent transition-colors">{project.name}</h3>
              <button 
                onClick={(e) => handleDeleteProject(project.id, e)}
                className="opacity-0 group-hover:opacity-100 p-2 text-app-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-sm text-app-text-dim leading-relaxed line-clamp-2">{project.description || 'Nenhuma diretriz definida para este projeto.'}</p>
            <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-app-text-dim group-hover:text-app-fg transition-colors">
              <span>Acessar Dossiê</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
        
        {!isLoading && projects.length === 0 && (
          <div className="col-span-full py-32 bento-grid-item border-dashed flex flex-col items-center justify-center text-app-text-dim">
            <Plus size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest">Nenhum projeto no radar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
