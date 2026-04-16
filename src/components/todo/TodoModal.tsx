import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  FolderKanban, 
  CheckCircle2, 
  Circle,
  Trash2,
  Clock,
  Type,
  AlignLeft,
  Tag,
  Users,
  Target
} from 'lucide-react';
import { Todo, Project, TeamMember, Goal, Tag as TagType } from '../../types';
import { TaskAttachments } from './TaskAttachments';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';

interface TodoModalProps {
  todo: Todo;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Todo>) => void | Promise<void>;
  onDelete: (id: number) => void | Promise<void>;
  onToggle: (id: number, completed: boolean) => void | Promise<void>;
}

export function TodoModal({
  todo,
  projects,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggle
}: TodoModalProps) {
  const [text, setText] = useState(todo.text);
  const [dueDate, setDueDate] = useState(todo.dueDate || '');
  const [projectId, setProjectId] = useState<number | null>(todo.projectId);
  const [priority, setPriority] = useState(todo.priority || 'medium');
  const [assignedTo, setAssignedTo] = useState<number | null>(todo.assignedTo);
  const [goalId, setGoalId] = useState<number | null>(todo.goalId);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(todo.tags?.map(t => t.id) || []);
  const [isSaving, setIsSaving] = useState(false);
  
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setText(todo.text);
      setDueDate(todo.dueDate || '');
      setProjectId(todo.projectId);
      setPriority(todo.priority || 'medium');
      setAssignedTo(todo.assignedTo);
      setGoalId(todo.goalId);
      setSelectedTagIds(todo.tags?.map(t => t.id) || []);
      
      // Load team, goals, and tags
      api.team.getAll().then(setTeam);
      api.strategy.getGoals().then(setGoals);
      api.tags.getAll().then(setAllTags);
    }
  }, [isOpen, todo]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(todo.id, {
        text,
        dueDate: dueDate || null,
        projectId,
        priority: priority as any,
        assignedTo,
        goalId,
        tagIds: selectedTagIds
      } as any);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await api.tags.create({ name: newTagName.trim() });
      setAllTags([...allTags, newTag]);
      setSelectedTagIds([...selectedTagIds, newTag.id]);
      setNewTagName('');
      setIsCreatingTag(false);
      
      // Update todo with new tag
      await onUpdate(todo.id, { tagIds: [...selectedTagIds, newTag.id] } as any);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const toggleTag = (tagId: number) => {
    const newIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    setSelectedTagIds(newIds);
    onUpdate(todo.id, { tagIds: newIds } as any);
  };

  const project = projects.find(p => p.id === projectId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-app-bg border-l border-app-border shadow-2xl flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-app-border">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggle(todo.id, !todo.completed)}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                    todo.completed 
                      ? "bg-app-accent border-app-accent text-app-bg" 
                      : "bg-transparent border-app-border hover:border-app-accent/50"
                  )}
                >
                  {todo.completed && <CheckCircle2 size={16} />}
                </button>
                <h2 className="text-sm font-bold uppercase tracking-widest text-app-fg">Detalhes da Tarefa</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-app-card text-app-text-dim hover:text-app-fg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Title Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-app-text-dim">Título</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={handleSave}
                  rows={3}
                  className="w-full bg-transparent border-none focus:ring-0 text-xl font-bold text-app-fg placeholder:text-app-fg/20 p-0 resize-none"
                  placeholder="O que precisa ser feito?"
                />
              </div>

              {/* Metadata Section */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                    <Calendar size={12} />
                    Data de Entrega
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      onUpdate(todo.id, { dueDate: e.target.value || null });
                    }}
                    className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-fg focus:border-app-accent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                    <Tag size={12} />
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value as any);
                      onUpdate(todo.id, { priority: e.target.value as any });
                    }}
                    className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-fg focus:border-app-accent transition-all"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                    <FolderKanban size={12} />
                    Projeto
                  </label>
                  <select
                    value={projectId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setProjectId(val);
                      onUpdate(todo.id, { projectId: val });
                    }}
                    className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-fg focus:border-app-accent transition-all"
                  >
                    <option value="">Sem Projeto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                    <Users size={12} />
                    Responsável
                  </label>
                  <select
                    value={assignedTo || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setAssignedTo(val);
                      onUpdate(todo.id, { assignedTo: val });
                    }}
                    className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-fg focus:border-app-accent transition-all"
                  >
                    <option value="">Não Atribuído</option>
                    {team.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                    <Target size={12} />
                    Meta Vinculada
                  </label>
                  <select
                    value={goalId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setGoalId(val);
                      onUpdate(todo.id, { goalId: val });
                    }}
                    className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-fg focus:border-app-accent transition-all"
                  >
                    <option value="">Sem Meta</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                {/* Tags Section */}
                <div className="col-span-2 space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                    <Tag size={12} />
                    Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                          selectedTagIds.includes(tag.id)
                            ? "bg-app-accent/10 border-app-accent text-app-accent"
                            : "bg-app-card border-app-border text-app-text-dim hover:border-app-accent/30"
                        )}
                        style={selectedTagIds.includes(tag.id) ? { borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}10` } : {}}
                      >
                        {tag.name}
                      </button>
                    ))}
                    
                    {isCreatingTag ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateTag();
                            if (e.key === 'Escape') setIsCreatingTag(false);
                          }}
                          className="bg-app-card border border-app-accent rounded-lg px-3 py-1 text-[10px] font-bold text-app-fg w-32"
                          placeholder="Nome da tag..."
                        />
                        <button 
                          onClick={handleCreateTag}
                          className="p-1 text-app-accent hover:bg-app-accent/10 rounded-md"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button 
                          onClick={() => setIsCreatingTag(false)}
                          className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-md"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCreatingTag(true)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-app-card border border-dashed border-app-border text-app-text-dim hover:border-app-accent hover:text-app-accent transition-all"
                      >
                        + Nova Etiqueta
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-4 pt-8 border-t border-app-border">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-app-text-dim">
                  <AlignLeft size={12} />
                  Anexos e Notas
                </label>
                <TaskAttachments todoId={todo.id} />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-app-border flex items-center justify-between">
              <button
                onClick={async () => {
                  if (confirm('Deseja realmente excluir esta tarefa?')) {
                    await onDelete(todo.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
              >
                <Trash2 size={16} />
                Excluir
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-2 bg-app-accent text-app-bg rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Salvar e Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
