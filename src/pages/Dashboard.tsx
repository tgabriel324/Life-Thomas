import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckSquare, FolderKanban, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAgentStore } from '../store/useAgentStore';
import { Bot, Zap, TrendingUp, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { switchContext, agents } = useAgentStore();

  useEffect(() => {
    switchContext('system');
  }, [switchContext]);

  const systemAgent = agents.find(a => a.type === 'system');
  const directors = agents.filter(a => a.type === 'director');
  const projects = agents.filter(a => a.type === 'project');

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
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 space-y-12">
      {/* Status Reports Hierárquicos (Passo 3) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Bot className="text-indigo-600" />
              RELATÓRIOS DE CONSCIÊNCIA
            </h2>
            <p className="text-sm text-zinc-500">Visão macro do seu império processada pelo {systemAgent?.name || 'Deus'}.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            <Zap size={12} className="animate-pulse" />
            Sincronia Ativa
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {directors.map(director => (
            <div key={director.id} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                    <TrendingUp className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Diretoria</p>
                    <h3 className="text-sm font-bold text-zinc-900">{director.name}</h3>
                  </div>
                </div>
                <div className="text-[10px] font-medium text-zinc-400">Status: Operacional</div>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-zinc-600 leading-relaxed italic">
                  "Monitorando {projects.length} projetos ativos. Alinhamento estratégico mantido com o núcleo central."
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-zinc-100 rounded-md text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                    {projects.length} Projetos
                  </span>
                  <span className="px-2 py-1 bg-emerald-50 rounded-md text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                    Eficiência: 94%
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {directors.length === 0 && (
            <div className="col-span-2 py-12 border-2 border-dashed border-zinc-100 rounded-3xl flex flex-col items-center justify-center text-zinc-400">
              <AlertCircle size={32} className="mb-2 opacity-20" />
              <p className="text-xs font-medium">Aguardando relatórios dos diretores...</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
