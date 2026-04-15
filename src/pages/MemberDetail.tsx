import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  Briefcase, 
  Trash2, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { TeamMember, Todo } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allMembers = await api.team.getAll();
      const found = allMembers.find(m => m.id === Number(id));
      if (found) {
        setMember(found);
        setIsLoadingTasks(true);
        const memberTasks = await api.todos.getAll({ assignedTo: found.id });
        setTasks(memberTasks);
      }
    } catch (error) {
      console.error('Failed to load member data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingTasks(false);
    }
  };

  const handleUpdateStatus = async (status: TeamMember['status']) => {
    if (!member) return;
    try {
      const updated = await api.team.update(member.id, { status });
      setMember(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    if (!member || !confirm('Remover este membro da equipe?')) return;
    try {
      await api.team.delete(member.id);
      navigate('/team');
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-app-accent" size={32} /></div>;
  if (!member) return <div className="text-center py-24 text-app-text-dim">Membro não encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate('/team')}
        className="flex items-center gap-2 text-app-text-dim hover:text-app-fg transition-colors font-bold text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} />
        Voltar para Equipe
      </button>

      <div className="bg-app-card border border-app-border rounded-[2rem] p-8 md:p-12 shadow-xl overflow-hidden relative">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-app-accent/5 blur-[100px] -z-10" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative">
            <img 
              src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`} 
              alt={member.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover border-4 border-app-accent shadow-glow-accent"
            />
            <div className="absolute -bottom-2 -right-2 bg-app-bg border-2 border-app-accent rounded-2xl p-2 shadow-lg">
              <ShieldCheck size={24} className="text-app-accent" />
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl font-display font-black text-app-fg tracking-tight mb-2">{member.name}</h1>
              <p className="text-xl text-app-accent font-bold">{member.role}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a 
                href={`mailto:${member.email}`}
                className="flex items-center gap-3 bg-app-bg border border-app-border px-6 py-3 rounded-2xl text-sm font-bold text-app-fg hover:border-app-accent transition-all"
              >
                <Mail size={18} className="text-app-accent" />
                {member.email}
              </a>
              <a 
                href={`https://wa.me/${member.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-app-bg border border-app-border px-6 py-3 rounded-2xl text-sm font-bold text-app-fg hover:border-emerald-500 transition-all"
              >
                <MessageCircle size={18} className="text-emerald-500" />
                WhatsApp
              </a>
            </div>

            <div className="flex gap-2 p-1 bg-app-bg border border-app-border rounded-2xl w-fit">
              {(['available', 'focused', 'busy'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    member.status === status 
                      ? "bg-app-accent text-app-bg shadow-glow-accent" 
                      : "text-app-text-dim hover:text-app-fg"
                  )}
                >
                  {status === 'available' ? 'Disponível' : status === 'focused' ? 'Focado' : 'Ocupado'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-black text-app-fg uppercase tracking-tight">Missões Ativas</h2>
            <span className="bg-app-accent/10 text-app-accent px-3 py-1 rounded-full text-xs font-bold">
              {tasks.filter(t => !t.completed).length} Pendentes
            </span>
          </div>

          {isLoadingTasks ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-app-card border border-app-border rounded-3xl animate-pulse" />)}
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map(task => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-6 rounded-3xl border flex items-center gap-4 transition-all group",
                    task.completed ? "bg-app-bg border-app-border opacity-50" : "bg-app-card border-app-border hover:border-app-accent/30"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    task.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-app-accent/10 text-app-accent"
                  )}>
                    {task.completed ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div className="flex-1">
                    <span className={cn("text-lg font-bold block", task.completed ? "line-through text-app-text-dim" : "text-app-fg")}>
                      {task.text}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-app-text-dim font-medium">Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-app-card/30 border-2 border-dashed border-app-border rounded-[2rem] text-center space-y-4">
              <AlertCircle size={48} className="text-app-text-dim" />
              <p className="text-app-text-dim font-bold">Nenhuma missão atribuída a este talento.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <section className="bg-app-card border border-app-border rounded-3xl p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-app-text-dim flex items-center gap-2">
              <Briefcase size={14} />
              Especialidades
            </h3>
            <div className="flex flex-wrap gap-2">
              {member.specialty?.split(',').map((s, i) => (
                <span key={i} className="bg-app-bg border border-app-border px-4 py-2 rounded-xl text-xs font-bold text-app-fg">
                  {s.trim()}
                </span>
              ))}
            </div>
          </section>

          <button 
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 py-4 text-rose-500 font-bold text-sm hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
          >
            <Trash2 size={18} />
            Remover Talento
          </button>
        </div>
      </div>
    </div>
  );
}
