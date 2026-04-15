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
  Loader2,
  X
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
      setShowAddMenu(false);
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
    <div className="mt-6 pt-6 border-t border-app-border/50 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-app-accent rounded-full" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-app-fg/80">Córtex de Ativos</h4>
        </div>
        <button 
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={cn(
            "p-2 rounded-xl transition-all flex items-center gap-2 border",
            showAddMenu 
              ? "bg-app-accent text-white border-app-accent shadow-glow-accent" 
              : "bg-app-card text-app-text-dim border-app-border hover:border-app-accent/30 hover:text-app-fg"
          )}
        >
          <Plus size={14} className={cn("transition-transform duration-300", showAddMenu && "rotate-45")} />
          <span className="text-[9px] font-black uppercase tracking-widest">Injetar Módulo</span>
        </button>
      </div>

      {showAddMenu && !newAttachment && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 bg-app-bg/40 p-6 rounded-[2rem] border border-app-border backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {MODULE_TYPES.map((m) => (
            <button
              key={m.type}
              onClick={() => setNewAttachment({ type: m.type, content: '' })}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-app-card border border-transparent hover:border-app-accent/20 transition-all group"
            >
              <div className="p-3 bg-app-bg rounded-xl group-hover:bg-app-accent/10 transition-colors">
                <m.icon size={20} className="text-app-text-dim group-hover:text-app-accent" />
              </div>
              <span className="text-[9px] font-black text-app-fg uppercase tracking-widest text-center">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {newAttachment && (
        <div className="bg-app-card p-6 rounded-2xl border border-app-accent/40 shadow-glow-accent/5 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-accent/10 rounded-xl text-app-accent">
                {getIcon(newAttachment.type)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-app-accent">Configurando Módulo</p>
                <h5 className="text-xs font-bold text-app-fg">{MODULE_TYPES.find(m => m.type === newAttachment.type)?.label}</h5>
              </div>
            </div>
            <button onClick={() => setNewAttachment(null)} className="text-app-text-dim hover:text-app-fg">
              <X size={16} />
            </button>
          </div>
          
          <textarea
            autoFocus
            value={newAttachment.content}
            onChange={(e) => setNewAttachment({ ...newAttachment, content: e.target.value })}
            placeholder={newAttachment.type === 'link' ? 'https://...' : 'Insira os dados brutos ou notas...'}
            className="w-full bg-app-bg/50 border border-app-border rounded-xl p-4 text-xs text-app-fg focus:ring-1 focus:ring-app-accent min-h-[120px] font-mono placeholder:text-app-text-dim/30"
          />
          
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={() => setNewAttachment(null)}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-app-text-dim hover:text-app-fg transition-colors"
            >
              Abortar
            </button>
            <button 
              onClick={handleAddAttachment}
              className="px-6 py-2 bg-app-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-glow-accent hover:scale-105 transition-all"
            >
              Confirmar Injeção
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-app-accent/20" size={24} /></div>
        ) : attachments.map((a) => (
          <div 
            key={a.id}
            className="group/item flex items-stretch gap-4 bg-app-card/40 rounded-2xl border border-app-border hover:border-app-accent/30 hover:bg-app-card/60 transition-all overflow-hidden"
          >
            <div className="w-1 bg-app-accent/20 group-hover/item:bg-app-accent transition-colors" />
            <div className="flex-1 py-4 pr-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-app-bg rounded-lg text-app-accent border border-app-border/50">
                    {getIcon(a.type)}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-app-fg">
                    {MODULE_TYPES.find(m => m.type === a.type)?.label}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteAttachment(a.id)}
                  className="opacity-0 group-hover/item:opacity-100 p-2 text-app-text-dim hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="bg-app-bg/40 rounded-xl p-3 border border-app-border/30">
                {a.type === 'link' || a.type === 'repo' ? (
                  <a 
                    href={a.content} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-app-accent hover:underline flex items-center gap-2 font-medium"
                  >
                    <span className="truncate">{a.content}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                ) : a.type === 'image' ? (
                  <div className="space-y-2">
                    <img 
                      src={a.content} 
                      alt="Attachment" 
                      className="rounded-lg w-full max-h-64 object-cover border border-app-border/50"
                      referrerPolicy="no-referrer"
                    />
                    {a.metadata?.caption && <p className="text-[10px] text-app-text-dim italic">{a.metadata.caption}</p>}
                  </div>
                ) : (
                  <pre className="font-mono text-[11px] text-app-fg/90 whitespace-pre-wrap leading-relaxed">
                    {a.content}
                  </pre>
                )}
              </div>
              
              <div className="mt-2 flex justify-end">
                <span className="text-[8px] font-bold text-app-text-dim uppercase tracking-tighter">
                  Sincronizado em {new Date(a.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && attachments.length === 0 && !showAddMenu && !newAttachment && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-app-border/30 rounded-[2.5rem] opacity-40">
            <Database size={40} className="mb-4 text-app-text-dim" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-app-text-dim">Vácuo de Inteligência</p>
            <p className="text-[8px] font-mono uppercase tracking-widest mt-2 opacity-40">Aguardando injeção de ativos</p>
          </div>
        )}
      </div>
    </div>
  );
}
