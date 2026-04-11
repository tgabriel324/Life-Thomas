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
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 space-y-16">
      {/* Status Reports Hierárquicos */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-end justify-between border-b border-app-border pb-6">
          <div>
            <h2 className="text-3xl font-display font-black text-app-fg tracking-tighter flex items-center gap-3">
              <Bot className="text-app-accent" size={32} />
              CÓRTEX DE CONSCIÊNCIA
            </h2>
            <p className="text-sm text-app-text-dim mt-2">Visão macro do império processada por <span className="text-app-fg font-medium">{systemAgent?.name || 'Life Thomas (Deus)'}</span>.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-app-accent/10 border border-app-accent/20 rounded-full text-[10px] font-black text-app-accent uppercase tracking-[0.2em]">
            <Zap size={12} className="animate-pulse" />
            Sincronia Ativa
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {directors.map(director => (
            <div key={director.id} className="bento-grid-item p-8 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-app-bg rounded-2xl flex items-center justify-center border border-app-border group-hover:border-app-accent/50 transition-colors">
                    <TrendingUp className="text-app-accent" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-app-accent uppercase tracking-widest mb-1">Diretoria Estratégica</p>
                    <h3 className="text-lg font-display font-bold text-app-fg">{director.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <span className="text-[10px] font-bold text-app-text-dim uppercase tracking-tighter">Operacional</span>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-sm text-app-text-dim leading-relaxed font-serif italic opacity-80">
                  "Monitorando {projects.length} projetos ativos. Alinhamento estratégico mantido com o núcleo central. O fluxo de capital intelectual está otimizado."
                </p>
                <div className="flex gap-3">
                  <span className="px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-[10px] font-bold text-app-text-dim uppercase tracking-wider">
                    {projects.length} Projetos
                  </span>
                  <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Eficiência: 94%
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {directors.length === 0 && (
            <div className="col-span-2 py-20 bento-grid-item border-dashed flex flex-col items-center justify-center text-app-text-dim">
              <AlertCircle size={40} className="mb-4 opacity-20" />
              <p className="text-sm font-medium tracking-widest uppercase">Aguardando relatórios dos diretores...</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {cards.map((card) => (
          <Link 
            key={card.id}
            to={card.path}
            className="bento-grid-item p-8 group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={cn("w-12 h-12 rounded-2xl bg-app-bg border border-app-border flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-app-accent/20", card.color)}>
                <card.icon size={24} />
              </div>
              <ChevronRight size={20} className="text-app-text-dim group-hover:text-app-fg group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-display font-bold text-app-fg mb-2">{card.title}</h3>
            <p className="text-sm text-app-text-dim leading-relaxed">{card.description}</p>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
