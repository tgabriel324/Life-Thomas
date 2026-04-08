import React, { useState } from 'react';
import { 
  GripVertical, 
  CheckCircle2, 
  Circle,
  Calendar,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { Todo, Project } from '../../types';

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
  const [isEditing, setIsEditing] = useState(false);
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
        "group flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg transition-all",
        isDragging && "z-50 shadow-xl opacity-90 scale-[1.01] border-zinc-400",
        !isDragging && "hover:border-zinc-300",
        isEditing && "ring-2 ring-zinc-900 border-transparent"
      )}
    >
      {!isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <GripVertical size={16} />
        </button>
      )}

      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        disabled={isEditing}
        className={cn(
          "transition-all duration-200",
          todo.completed ? "text-zinc-900" : "text-zinc-300 hover:text-zinc-400",
          isEditing && "opacity-50 cursor-not-allowed"
        )}
      >
        {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      <div className="flex-1 flex flex-col min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm bg-zinc-50 border-none focus:ring-0 p-0 text-zinc-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-zinc-100 rounded px-1.5 py-0.5">
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 text-zinc-600 p-0"
                />
                {editDate && (
                  <button 
                    onClick={() => setEditDate('')}
                    className="ml-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <select
                value={editProjectId || ''}
                onChange={(e) => setEditProjectId(e.target.value ? Number(e.target.value) : null)}
                className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 rounded px-1.5 py-0.5 border-none focus:ring-0 text-zinc-600"
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
            onClick={() => setIsEditing(true)}
          >
            <span className={cn(
              "text-sm transition-all truncate block",
              todo.completed ? "text-zinc-400 line-through" : "text-zinc-700"
            )}>
              {todo.text}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {project && (
                <span 
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: project.color }}
                >
                  {project.name}
                </span>
              )}
              {todo.due_date && (
                <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(todo.due_date).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-all"
              title="Salvar"
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded transition-all"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-all"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
