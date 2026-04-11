import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon, 
  Github, 
  Code, 
  Video, 
  Table, 
  Presentation, 
  CheckSquare, 
  BarChart, 
  Clock, 
  MapPin, 
  User, 
  File, 
  Type, 
  Database, 
  Palette, 
  PenTool, 
  ExternalLink, 
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { TodoAttachment } from '../../types';
import { cn } from '../../lib/utils';

const MODULE_TYPES = [
  { type: 'audio', icon: Music, label: 'Áudio' },
  { type: 'image', icon: ImageIcon, label: 'Imagem' },
  { type: 'document', icon: FileText, label: 'Documento' },
  { type: 'link', icon: LinkIcon, label: 'Link' },
  { type: 'repo', icon: Github, label: 'Repositório' },
  { type: 'code', icon: Code, label: 'Código' },
  { type: 'video', icon: Video, label: 'Vídeo' },
  { type: 'table', icon: Table, label: 'Planilha' },
  { type: 'presentation', icon: Presentation, label: 'Apresentação' },
  { type: 'checklist', icon: CheckSquare, label: 'Checklist' },
  { type: 'metric', icon: BarChart, label: 'Métrica' },
  { type: 'date', icon: Clock, label: 'Prazo' },
  { type: 'location', icon: MapPin, label: 'Localização' },
  { type: 'contact', icon: User, label: 'Contato' },
  { type: 'file', icon: File, label: 'Arquivo' },
  { type: 'text', icon: Type, label: 'Texto Rico' },
  { type: 'json', icon: Database, label: 'Dados/JSON' },
  { type: 'palette', icon: Palette, label: 'Paleta' },
  { type: 'sketch', icon: PenTool, label: 'Esboço' },
  { type: 'embed', icon: ExternalLink, label: 'Embed' },
];

interface TaskAttachmentsProps {
  todoId: number;
}

export function TaskAttachments({ todoId }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<TodoAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newAttachment, setNewAttachment] = useState<{ type: string; content: string } | null>(null);

  const fetchAttachments = async () => {
    try {
      const data = await api.todos.getAttachments(todoId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [todoId]);

  const handleAddAttachment = async () => {
    if (!newAttachment || !newAttachment.content.trim()) return;
    try {
      const created = await api.todos.addAttachment(todoId, {
        type: newAttachment.type,
        content: newAttachment.content,
      });
      setAttachments([...attachments, created]);
      setNewAttachment(null);
    } catch (error) {
      console.error('Failed to add attachment:', error);
    }
  };

  const handleDeleteAttachment = async (id: number) => {
    try {
      await api.todos.deleteAttachment(id);
      setAttachments(attachments.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const getIcon = (type: string) => {
    const module = MODULE_TYPES.find(m => m.type === type);
    const Icon = module?.icon || File;
    return <Icon size={14} />;
  };

  return (
    <div className="mt-4 pt-4 border-t border-app-border space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-dim">Módulos de Inteligência</h4>
        <button 
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="p-1.5 bg-app-accent/10 text-app-accent rounded-lg hover:bg-app-accent/20 transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      {showAddMenu && !newAttachment && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 bg-app-bg/50 p-3 rounded-xl border border-app-border">
          {MODULE_TYPES.map((m) => (
            <button
              key={m.type}
              onClick={() => setNewAttachment({ type: m.type, content: '' })}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-app-card transition-all group"
            >
              <m.icon size={16} className="text-app-text-dim group-hover:text-app-accent" />
              <span className="text-[8px] font-bold text-app-text-dim uppercase tracking-tighter">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {newAttachment && (
        <div className="bg-app-card p-4 rounded-xl border border-app-accent/30 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            {getIcon(newAttachment.type)}
            <span className="text-[10px] font-black uppercase tracking-widest text-app-fg">
              Novo Módulo: {MODULE_TYPES.find(m => m.type === newAttachment.type)?.label}
            </span>
          </div>
          <textarea
            autoFocus
            value={newAttachment.content}
            onChange={(e) => setNewAttachment({ ...newAttachment, content: e.target.value })}
            placeholder={newAttachment.type === 'link' ? 'Cole a URL aqui...' : 'Insira o conteúdo do módulo...'}
            className="w-full bg-app-bg border border-app-border rounded-lg p-3 text-xs text-app-fg focus:ring-1 focus:ring-app-accent min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setNewAttachment(null)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-app-text-dim hover:text-app-fg"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddAttachment}
              className="px-3 py-1.5 bg-app-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-glow-accent"
            >
              Anexar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-app-accent/30" size={20} /></div>
        ) : attachments.map((a) => (
          <div 
            key={a.id}
            className="group/item flex items-start gap-3 p-3 bg-app-bg/30 rounded-xl border border-app-border hover:border-app-accent/20 transition-all"
          >
            <div className="mt-0.5 p-1.5 bg-app-card rounded-lg text-app-accent border border-app-border">
              {getIcon(a.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-app-text-dim/60">
                  {MODULE_TYPES.find(m => m.type === a.type)?.label}
                </span>
                <button 
                  onClick={() => handleDeleteAttachment(a.id)}
                  className="opacity-0 group-hover/item:opacity-100 p-1 text-app-text-dim hover:text-rose-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="text-xs text-app-fg break-all line-clamp-3">
                {a.type === 'link' || a.type === 'repo' ? (
                  <a href={a.content} target="_blank" rel="noopener noreferrer" className="text-app-accent hover:underline flex items-center gap-1">
                    {a.content} <ExternalLink size={10} />
                  </a>
                ) : (
                  <pre className="font-mono text-[10px] whitespace-pre-wrap">{a.content}</pre>
                )}
              </div>
            </div>
          </div>
        ))}
        {!isLoading && attachments.length === 0 && !showAddMenu && (
          <div className="text-center py-4 text-[10px] text-app-text-dim italic">
            Nenhum módulo de inteligência anexado.
          </div>
        )}
      </div>
    </div>
  );
}
