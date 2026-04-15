import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Trash2,
  AlertCircle,
  Loader2,
  BarChart3,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { Goal, Todo, Objective } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [goalsData, objectivesData] = await Promise.all([
        api.strategy.getGoals(),
        api.strategy.getObjectives()
      ]);
      
      const foundGoal = goalsData.find(g => g.id === Number(id));
      if (foundGoal) {
        setGoal(foundGoal);
        const foundObj = objectivesData.find(o => o.id === foundGoal.objectiveId);
        setObjective(foundObj || null);
        
        setIsLoadingTasks(true);
        const goalTasks = await api.todos.getAll({ goalId: foundGoal.id });
        setTasks(goalTasks);
      }
    } catch (error) {
      console.error('Failed to load goal data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingTasks(false);
    }
  };

  const handleUpdateProgress = async (current: string) => {
    if (!goal) return;
    try {
      const updated = await api.strategy.updateGoal(goal.id, { currentValue: current });
      setGoal(updated);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleDelete = async () => {
    if (!goal || !confirm('Excluir esta meta estratégica?')) return;
    try {
      await api.strategy.deleteGoal(goal.id);
      navigate('/strategy');
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const calculateProgress = (current: string, target: string | null) => {
    if (!target || target === '0') return 0;
    const curr = parseFloat(current);
    const targ = parseFloat(target);
    return Math.min(Math.round((curr / targ) * 100), 100);
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-app-accent" size={32} /></div>;
  if (!goal) return <div className="text-center py-24 text-app-text-dim">Meta não encontrada.</div>;

  const progress = calculateProgress(goal.currentValue, goal.targetValue);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate('/strategy')}
        className="flex items-center gap-2 text-app-text-dim hover:text-app-fg transition-colors font-bold text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} />
        Voltar para Estratégia
      </button>

      <div className="bg-app-card border border-app-border rounded-[2rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-app-accent/5 blur-[100px] -z-10" />
        
        <div className="space-y-8">
          <div className="flex items-center gap-4 text-app-accent">
            <div className="w-12 h-12 rounded-2xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Meta Estratégica</span>
          </div>

          <div>
            <h1 className="text-4xl font-display font-black text-app-fg tracking-tight mb-4">{goal.title}</h1>
            {objective && (
              <div className="flex items-center gap-2 text-app-text-dim">
                <Target size={14} />
                <span className="text-sm font-bold uppercase tracking-wider">Objetivo: {objective.title}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-app-bg/50 border border-app-border p-6 rounded-3xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-text-dim block mb-2">Prazo Final</span>
              <div className="flex items-center gap-3 text-app-fg">
                <Calendar size={18} className="text-app-accent" />
                <span className="font-bold">{goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
              </div>
            </div>
            <div className="bg-app-bg/50 border border-app-border p-6 rounded-3xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-text-dim block mb-2">Alvo</span>
              <div className="flex items-center gap-3 text-app-fg">
                <Zap size={18} className="text-app-accent" />
                <span className="font-bold">{goal.targetValue || '∞'}</span>
              </div>
            </div>
            <div className="bg-app-bg/50 border border-app-border p-6 rounded-3xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-text-dim block mb-2">Status</span>
              <div className="flex items-center gap-3 text-app-fg">
                <BarChart3 size={18} className="text-app-accent" />
                <span className="font-bold uppercase tracking-widest text-xs">{progress >= 100 ? 'Concluída' : 'Em Progresso'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-app-card border border-app-border rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-app-text-dim">Progresso da Meta</h3>
              <span className="text-2xl font-black text-app-accent">{progress}%</span>
            </div>
            
            <div className="space-y-6">
              <div className="h-4 bg-app-bg rounded-full overflow-hidden border border-app-border p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-app-accent rounded-full shadow-glow-accent"
                />
              </div>
              
              <div className="flex items-center gap-6">
                <input 
                  type="range"
                  min="0"
                  max={goal.targetValue || 100}
                  value={goal.currentValue}
                  onChange={(e) => handleUpdateProgress(e.target.value)}
                  className="flex-1 accent-app-accent h-2 bg-app-bg rounded-full appearance-none cursor-pointer"
                />
                <div className="px-6 py-3 bg-app-bg border border-app-border rounded-2xl font-black text-app-fg text-xl">
                  {goal.currentValue}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-black text-app-fg uppercase tracking-tight">Tarefas Vinculadas</h2>
              <span className="bg-app-accent/10 text-app-accent px-3 py-1 rounded-full text-xs font-bold">
                {tasks.length} Total
              </span>
            </div>

            {isLoadingTasks ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-20 bg-app-card border border-app-border rounded-3xl animate-pulse" />)}
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    className={cn(
                      "p-6 rounded-3xl border flex items-center gap-4 transition-all",
                      task.completed ? "bg-app-bg border-app-border opacity-50" : "bg-app-card border-app-border hover:border-app-accent/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      task.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-app-accent/10 text-app-accent"
                    )}>
                      {task.completed ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <span className={cn("text-lg font-bold", task.completed ? "line-through text-app-text-dim" : "text-app-fg")}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-app-card/30 border-2 border-dashed border-app-border rounded-[2rem] text-center space-y-4">
                <AlertCircle size={48} className="text-app-text-dim" />
                <p className="text-app-text-dim font-bold">Nenhuma tarefa vinculada a esta meta estratégica.</p>
              </div>
            )}
          </section>
        </div>

        <div>
          <button 
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 py-4 text-rose-500 font-bold text-sm hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
          >
            <Trash2 size={18} />
            Excluir Meta
          </button>
        </div>
      </div>
    </div>
  );
}
