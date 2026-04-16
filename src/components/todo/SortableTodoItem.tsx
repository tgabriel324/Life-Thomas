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
import { TodoModal } from './TodoModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const project = projects.find(p => p.id === todo.projectId);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex flex-col bg-app-card border border-app-border rounded-2xl transition-all duration-300 overflow-hidden",
          isDragging && "z-50 shadow-glow-accent opacity-90 scale-[1.02] border-app-accent",
          !isDragging && "hover:border-app-accent/30 hover:shadow-glow-accent/5",
          isModalOpen && !isDragging && "border-app-accent/20 shadow-glow-accent/5 bg-app-card/80 backdrop-blur-sm"
        )}
      >
        <div className="flex items-center gap-4 p-4">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-app-text-dim/20 hover:text-app-accent transition-colors shrink-0"
          >
            <GripVertical size={16} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(todo.id, !todo.completed);
            }}
            className={cn(
              "relative flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-300 shrink-0",
              todo.completed 
                ? "bg-app-accent border-app-accent text-app-bg" 
                : "bg-transparent border-app-border hover:border-app-accent/50"
            )}
          >
            {todo.completed && <CheckCircle2 size={12} />}
          </button>

          <div 
            className="flex-1 flex flex-col min-w-0 cursor-pointer py-1"
            onClick={() => setIsModalOpen(true)}
          >
            <span className={cn(
              "text-sm transition-all truncate block font-semibold tracking-tight",
              todo.completed ? "text-app-text-dim/40 line-through" : "text-app-fg"
            )}>
              {todo.text}
            </span>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {project && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-app-accent">
                  {project.name}
                </span>
              )}
              {todo.dueDate && (
                <span className="text-[9px] font-bold text-app-text-dim flex items-center gap-1 uppercase tracking-widest">
                  <Calendar size={10} />
                  {new Date(todo.dueDate).toLocaleDateString('pt-BR')}
                </span>
              )}
              {todo.tags && todo.tags.length > 0 && (
                <div className="flex gap-1">
                  {todo.tags.map(tag => (
                    <span 
                      key={tag.id}
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-app-accent/10 border border-app-accent/20 text-app-accent uppercase tracking-tighter"
                      style={{ borderColor: `${tag.color}40`, color: tag.color, backgroundColor: `${tag.color}10` }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-2 text-app-text-dim/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <TodoModal
        todo={todo}
        projects={projects}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggle={onToggle}
      />
    </>
  );
}
