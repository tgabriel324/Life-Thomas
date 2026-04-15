import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckSquare, FolderKanban, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAgentStore } from '../store/useAgentStore';
import { Bot, Zap, TrendingUp, AlertCircle, Database, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function Dashboard() {
  const { switchContext, agents, notifyChange } = useAgentStore();
  const [isSeeding, setIsSeeding] = React.useState(false);

  useEffect(() => {
    switchContext('system');
  }, [switchContext]);

  const handleSeed = async () => {
    // Using a simple state-based confirmation would be better, but for now let's just execute
    setIsSeeding(true);
    try {
      await api.todos.seed();
      notifyChange('Dados de exemplo injetados no sistema. Sincronia concluída.');
      // Instead of reload, we could just re-fetch, but reload is easier for now
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Seed failed:', error);
    } finally {
      setIsSeeding(false);
    }
  };

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
    <div className="space-y-12">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold text-app-fg tracking-tight">
            Bem-vindo, <span className="text-app-accent">Thomas</span>
          </h1>
          <p className="text-app-text-dim mt-2 font-medium">
            Aqui está o resumo do seu império hoje.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-5 py-2.5 bg-app-card border border-app-border rounded-xl text-xs font-bold text-app-fg hover:border-app-accent/30 hover:bg-app-bg transition-all disabled:opacity-50"
          >
            {isSeeding ? <Loader2 className="animate-spin" size={14} /> : <Database size={14} />}
            Resetar Dados
          </button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link 
            key={card.id}
            to={card.path}
            className="group p-8 bg-app-card border border-app-border rounded-3xl hover:border-app-accent/30 transition-all duration-500 relative overflow-hidden"
          >
            <div className={cn("mb-6 w-12 h-12 rounded-2xl bg-app-bg border border-app-border flex items-center justify-center transition-all duration-500 group-hover:scale-110", card.color)}>
              <card.icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-app-fg mb-2">{card.title}</h3>
            <p className="text-sm text-app-text-dim leading-relaxed">{card.description}</p>
            <ChevronRight size={20} className="absolute bottom-8 right-8 text-app-text-dim/20 group-hover:text-app-accent group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Agents/Directors Section */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-dim">Agentes Ativos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {directors.map(director => (
            <div key={director.id} className="p-8 bg-app-card border border-app-border rounded-3xl flex items-start gap-6">
              <div className="w-12 h-12 bg-app-bg rounded-2xl flex items-center justify-center border border-app-border shrink-0">
                <TrendingUp className="text-app-accent" size={24} />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-app-fg">{director.name}</h3>
                  <p className="text-xs font-bold text-app-accent uppercase tracking-widest mt-1">Diretoria Estratégica</p>
                </div>
                <p className="text-sm text-app-text-dim leading-relaxed italic">
                  "Monitorando {projects.length} projetos ativos. O fluxo de capital intelectual está otimizado."
                </p>
                <div className="flex gap-6 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-app-text-dim uppercase tracking-widest">Projetos</span>
                    <span className="text-lg font-bold text-app-fg">{projects.length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-app-text-dim uppercase tracking-widest">Eficiência</span>
                    <span className="text-lg font-bold text-emerald-500">94%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {directors.length === 0 && (
            <div className="col-span-2 py-12 border-2 border-dashed border-app-border rounded-3xl flex flex-col items-center justify-center text-app-text-dim">
              <AlertCircle size={32} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhum agente ativo no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
