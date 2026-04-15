import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users2, 
  Plus, 
  Mail, 
  MessageCircle, 
  Briefcase, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import { api } from '../services/api';
import { TeamMember } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Team() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    specialty: '',
    email: '',
    whatsapp: '',
    status: 'available' as const
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const data = await api.team.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberClick = (id: number) => {
    navigate(`/team/${id}`);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.team.create({
        ...newMember,
        avatar: `https://i.pravatar.cc/150?u=${newMember.name}`
      });
      setMembers([...members, created]);
      setShowAddModal(false);
      setNewMember({ name: '', role: '', specialty: '', email: '', whatsapp: '', status: 'available' });
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return;
    try {
      await api.team.delete(id);
      setMembers(members.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-app-fg tracking-tight">Quartel General</h1>
          <p className="text-app-text-dim mt-1">Gerencie os talentos do seu império.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-app-accent text-app-bg px-6 py-3 rounded-2xl font-bold hover:shadow-glow-accent transition-all active:scale-95"
        >
          <Plus size={20} />
          Adicionar Talento
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-app-card border border-app-border rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <motion.div
              key={member.id}
              onClick={() => handleMemberClick(member.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-app-card border border-app-border rounded-3xl p-6 hover:border-app-accent/30 transition-all duration-500 overflow-hidden cursor-pointer"
            >
              {/* Status Indicator */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  member.status === 'available' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                  member.status === 'focused' ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" :
                  "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                  {member.status === 'available' ? 'Disponível' :
                   member.status === 'focused' ? 'Focado' : 'Ocupado'}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <img 
                    src={member.avatar || `https://i.pravatar.cc/150?u=${member.id}`} 
                    alt={member.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-app-border group-hover:border-app-accent transition-colors"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-app-bg border border-app-border rounded-lg p-1">
                    <ShieldCheck size={12} className="text-app-accent" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-app-fg leading-tight">{member.name}</h3>
                  <p className="text-sm text-app-accent font-medium">{member.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-app-text-dim">
                  <Briefcase size={16} className="shrink-0" />
                  <span className="text-xs font-medium truncate">{member.specialty || 'Especialista'}</span>
                </div>
                
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <a 
                    href={`mailto:${member.email}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-app-bg border border-app-border py-2 rounded-xl text-xs font-bold hover:bg-app-card hover:border-app-accent transition-all"
                  >
                    <Mail size={14} />
                    E-mail
                  </a>
                  <a 
                    href={`https://wa.me/${member.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-app-bg border border-app-border py-2 rounded-xl text-xs font-bold hover:bg-app-card hover:border-emerald-500/50 transition-all"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => handleDeleteMember(member.id)}
                  className="p-2 text-app-text-dim hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-app-card border border-app-border w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-display font-black text-app-fg mb-6">Novo Talento</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Nome Completo</label>
                <input 
                  required
                  type="text"
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Cargo</label>
                  <input 
                    required
                    type="text"
                    value={newMember.role}
                    onChange={e => setNewMember({...newMember, role: e.target.value})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                    placeholder="Ex: Designer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Status</label>
                  <select 
                    value={newMember.status}
                    onChange={e => setNewMember({...newMember, status: e.target.value as any})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all appearance-none"
                  >
                    <option value="available">Disponível</option>
                    <option value="focused">Focado</option>
                    <option value="busy">Ocupado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">Especialidade</label>
                <input 
                  type="text"
                  value={newMember.specialty}
                  onChange={e => setNewMember({...newMember, specialty: e.target.value})}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                  placeholder="Ex: Figma, React, Tráfego..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">E-mail</label>
                  <input 
                    type="email"
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-text-dim mb-2">WhatsApp</label>
                  <input 
                    type="text"
                    value={newMember.whatsapp}
                    onChange={e => setNewMember({...newMember, whatsapp: e.target.value})}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-app-fg focus:border-app-accent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold text-app-text-dim hover:bg-app-bg transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-app-accent text-app-bg px-6 py-3 rounded-2xl font-bold hover:shadow-glow-accent transition-all"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
