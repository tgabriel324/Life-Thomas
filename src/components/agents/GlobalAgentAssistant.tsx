import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  MessageSquare, 
  Zap, 
  ChevronUp,
  ChevronDown,
  BrainCircuit
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAgentStore } from '../../store/useAgentStore';
import { ai, generateEmbedding } from '../../lib/gemini';

interface Message {
  role: 'user' | 'agent';
  content: string;
  isStreaming?: boolean;
}

export function GlobalAgentAssistant() {
  const { activeAgent, agents, fetchAgents, lastEvent } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thought, setThought] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents();
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thought]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeAgent || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);
    setThought('Acessando núcleo vetorial...');

    try {
      const embedding = await generateEmbedding(userMessage);
      
      setThought('Recuperando memórias estratégicas...');
      const searchResponse = await fetch('/api/agents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          embedding, 
          agentId: activeAgent.id,
          limit: 2 
        })
      });
      const memories = await searchResponse.json();
      const context = memories.map((m: any) => m.content).join('\n---\n');
      
      setThought('Sincronizando com Gemini...');
      const systemPrompt = `
        Você é o agente "${activeAgent.name}".
        Tipo: ${activeAgent.type}
        Persona: ${activeAgent.persona}
        Contexto Recuperado: ${context || 'Nenhuma memória específica.'}
        
        Responda de forma curta, direta e estratégica. Você está ajudando o Thomas em uma tarefa específica agora.
      `;

      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: { systemInstruction: systemPrompt }
      });

      setIsThinking(false);
      setThought('');
      
      // Add empty agent message for streaming
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: '',
        isStreaming: true
      }]);

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'agent') {
              lastMessage.content = fullText;
            }
            return newMessages;
          });
        }
      }

      // Mark streaming as finished
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'agent') {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });

    } catch (error) {
      console.error('Assistant error:', error);
      setIsThinking(false);
      setThought('');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {lastEvent && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-64 bg-zinc-950/90 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.2)] flex items-start gap-3 z-50"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Zap size={16} className="text-indigo-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Consciência Ativa</p>
              <p className="text-[11px] text-zinc-300 leading-tight">{lastEvent}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 h-[450px] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Ativo Agora</p>
                  <p className="text-xs font-bold text-white truncate w-40">{activeAgent?.name || 'Carregando...'}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                  <BrainCircuit size={32} className="mb-2" />
                  <p className="text-[10px] uppercase font-bold tracking-widest">Núcleo de Inteligência</p>
                  <p className="text-[11px] mt-2">Como posso acelerar sua visão hoje?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col gap-1",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed relative overflow-hidden",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800"
                  )}>
                    {msg.content}
                    {msg.isStreaming && (
                      <motion.span 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-1 h-3 bg-indigo-400 ml-1 translate-y-0.5"
                      />
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono italic">
                  <Zap size={10} className="animate-pulse text-indigo-400" />
                  {thought}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/50 border-t border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Comando rápido..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={isThinking || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-indigo-400 disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative group",
          isOpen ? "bg-zinc-900 text-white rotate-90" : "bg-indigo-600 text-white"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity animate-pulse" />
        {isOpen ? <X size={24} /> : <Bot size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
