import React, { useState } from 'react';
import { 
  GripVertical, 
  CheckCircle2, 
  Circle,
  Calendar,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { Todo, Project } from '../../types';
import { useAgentStore } from '../../store/useAgentStore';
import { TaskAttachments } from './TaskAttachments';

interface SortableTodoItemProps {
  key?: React.Key;
  todo: Todo; 
  onToggle: (id: number, completed: boolean) => void | Promise<void>; 
  onDelete: (id: number) => void | Promise<void>;
  onUpdate: (id: number, updates: Partial<Todo>) => void | Promise<void>;
  projects?: Project[];
}

export function SortableTodoItem({ 
  todo, 
  onToggle, 
  onDelete,
  onUpdate,
  projects = []
}: SortableTodoItemProps) {
  const { switchContext } = useAgentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDate, setEditDate] = useState(todo.due_date || '');
  const [editProjectId, setEditProjectId] = useState<number | null>(todo.project_id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const project = projects.find(p => p.id === todo.project_id);

  const handleStartEdit = () => {
    setIsEditing(true);
    switchContext('task', todo.id);
  };

  const handleSave = async () => {
    await onUpdate(todo.id, {
      text: editText,
      due_date: editDate || null,
      project_id: editProjectId
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditDate(todo.due_date || '');
    setEditProjectId(todo.project_id);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-4 p-4 bg-app-card border border-app-border rounded-2xl transition-all",
        isDragging && "z-50 shadow-glow-accent opacity-90 scale-[1.02] border-app-accent",
        !isDragging && "hover:border-app-accent/30 hover:shadow-glow-accent/5",
        isEditing && "ring-2 ring-app-accent border-transparent"
      )}
    >
      {!isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-app-text-dim/40 hover:text-app-fg transition-colors"
        >
          <GripVertical size={18} />
        </button>
      )}

      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        disabled={isEditing}
        className={cn(
          "transition-all duration-300",
          todo.completed ? "text-app-accent" : "text-app-text-dim/30 hover:text-app-accent",
          isEditing && "opacity-50 cursor-not-allowed"
        )}
      >
        {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </button>

      <div className="flex-1 flex flex-col min-w-0">
        {isEditing ? (
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm bg-app-bg/50 border-none focus:ring-0 p-2 rounded-lg text-app-fg placeholder:text-app-text-dim/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-app-bg/50 rounded-lg px-2 py-1 border border-app-border">
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="text-[10px] font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 text-app-fg p-0"
                />
                {editDate && (
                  <button 
                    onClick={() => setEditDate('')}
                    className="ml-2 text-app-text-dim hover:text-app-fg"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <select
                value={editProjectId || ''}
                onChange={(e) => setEditProjectId(e.target.value ? Number(e.target.value) : null)}
                className="text-[10px] font-black uppercase tracking-widest bg-app-bg/50 rounded-lg px-2 py-1 border border-app-border focus:ring-0 text-app-fg"
              >
                <option value="">Sem Projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div 
            className="cursor-pointer" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-sm transition-all truncate block font-medium",
                todo.completed ? "text-app-text-dim/40 line-through" : "text-app-fg"
              )}>
                {todo.text}
              </span>
              <button className="text-app-text-dim/40 group-hover:text-app-accent transition-colors">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {project && (
                <span 
                  className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-black/10"
                  style={{ color: project.color || 'var(--app-accent)' }}
                >
                  {project.name}
                </span>
              )}
              {todo.due_date && (
                <span className="text-[9px] font-bold text-app-text-dim flex items-center gap-1 uppercase tracking-widest">
                  <Calendar size={10} />
                  {new Date(todo.due_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        )}
        
        {isExpanded && !isEditing && (
          <TaskAttachments todoId={todo.id} />
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all"
              title="Salvar"
            >
              <CheckCircle2 size={18} />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-app-text-dim hover:bg-app-bg rounded-xl transition-all"
              title="Cancelar"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleStartEdit}
              className="opacity-0 group-hover:opacity-100 p-2 text-app-text-dim hover:text-app-fg hover:bg-app-bg rounded-xl transition-all"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-app-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
              title="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
