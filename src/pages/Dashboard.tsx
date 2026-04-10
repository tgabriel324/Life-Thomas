import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckSquare, FolderKanban, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAgentStore } from '../store/useAgentStore';

export function Dashboard() {
  const { switchContext } = useAgentStore();

  useEffect(() => {
    switchContext('system');
  }, [switchContext]);

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
