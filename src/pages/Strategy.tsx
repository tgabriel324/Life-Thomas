import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Zap,
  BarChart3,
  X,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Objective, Goal } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Strategy() {
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);

  const [newObjective, setNewObjective] = useState({ title: '', description: '' });
  const [newGoal, setNewGoal] = useState({ title: '', targetValue: '', currentValue: '0', deadline: '', objectiveId: 0 });

  useEffect(() => {
    loadStrategy();
  }, []);

  const loadStrategy = async () => {
    try {
      const [objData, goalData] = await Promise.all([
        api.strategy.getObjectives(),
        api.strategy.getGoals()
      ]);
      setObjectives(objData);
      setGoals(goalData);
    } catch (error) {
      console.error('Failed to load strategy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalClick = (id: number) => {
    navigate(`/strategy/goal/${id}`);
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.strategy.createObjective(newObjective);
      setObjectives([...objectives, created]);
      setShowAddObjective(false);
      setNewObjective({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to add objective:', error);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.strategy.createGoal({ ...newGoal, objectiveId: selectedObjective?.id || 0 });
      setGoals([...goals, created]);
      setShowAddGoal(false);
      setNewGoal({ title: '', targetValue: '', currentValue: '0', deadline: '', objectiveId: 0 });
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const calculateProgress = (current: string, target: string | null) => {
    if (!target || target === '0') return 0;
    const curr = parseFloat(current);
    const targ = parseFloat(target);
    return Math.min(Math.round((curr / targ) * 100), 100);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-app-fg tracking-tight">Córtex Estratégico</h1>
          <p className="text-app-text-dim mt-1">Defina a visão e os marcos do seu império.</p>
        </div>
        <button 
          onClick={() => setShowAddObjective(true)}
          className="flex items-center gap-2 bg-app-accent text-app-bg px-6 py-3 rounded-2xl font-bold hover:shadow-glow-accent transition-all active:scale-95"
        >
          <Plus size={20} />
          Novo Objetivo
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-app-card border border-app-border rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {objectives.map((objective) => (
            <div key={objective.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-app-fg uppercase tracking-tight">{objective.title}</h2>
                    <p className="text-sm text-app-text-dim">{objective.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedObjective(objective);
                    setShowAddGoal(true);
                  }}
                  className="text-xs font-bold uppercase tracking-widest text-app-accent hover:underline"
                >
                  + Adicionar Meta
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.filter(g => g.objectiveId === objective.id).map((goal) => {
                  const progress = calculateProgress(goal.currentValue, goal.targetValue);
                  return (
                    <motion.div
                      key={goal.id}
                      onClick={() => handleGoalClick(goal.id)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-app-card border border-app-border rounded-3xl p-6 hover:border-app-accent/30 transition-all group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-app-fg leading-tight pr-4">{goal.title}</h3>
                        <div className="p-2 bg-app-bg rounded-xl text-app-accent">
                          <TrendingUp size={16} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-app-text-dim">Progresso</span>
                          <span className="text-app-accent">{progress}%</span>
                        </div>
                        <div className="h-2 bg-app-bg rounded-full overflow-hidden border border-app-border">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-app-accent shadow-glow-accent"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-app-text-dim">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold">{goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                          </div>
                          <div className="text-[10px] font-black text-app-fg">
                            {goal.currentValue} / {goal.targetValue || '∞'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Objective Modal */}

      {/* Add Objective Modal */}
      {showAddObjective && (
        <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-app-card border border-app-border w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-display font-black text-app-fg mb-6">Novo Objetivo</h2>
            <form onSubmit={handleAddObjective} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Título da Visão</label>
                <input 
                  required
                  type="text"
                  value={newObjective.title}
                  onChange={e => setNewObjective({...newObjective, title: e.target.value})}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                  placeholder="Ex: Dominação Global"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Descrição Estratégica</label>
                <textarea 
                  value={newObjective.description}
                  onChange={e => setNewObjective({...newObjective, description: e.target.value})}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all h-24 resize-none"
                  placeholder="Qual o propósito maior?"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddObjective(false)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold text-app-text-dim hover:bg-app-bg transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-app-accent text-app-bg px-6 py-3 rounded-2xl font-bold hover:shadow-glow-accent transition-all"
                >
                  Criar Visão
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-app-card border border-app-border w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-display font-black text-app-fg mb-6">Nova Meta</h2>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Título da Meta</label>
                <input 
                  required
                  type="text"
                  value={newGoal.title}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                  placeholder="Ex: Faturar R$ 100k"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Alvo (Número)</label>
                  <input 
                    type="text"
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal({...newGoal, targetValue: e.target.value})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                    placeholder="Ex: 100000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Prazo</label>
                  <input 
                    type="date"
                    value={newGoal.deadline}
                    onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold text-app-text-dim hover:bg-app-bg transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-app-accent text-app-bg px-6 py-3 rounded-2xl font-bold hover:shadow-glow-accent transition-all"
                >
                  Definir Meta
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
