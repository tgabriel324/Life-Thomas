import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Cpu, 
  Database, 
  Network, 
  Target, 
  Shield, 
  Zap, 
  MessageSquare,
  ChevronRight,
  Plus,
  RefreshCw,
  Send,
  BrainCircuit,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ai, generateEmbedding } from '../lib/gemini';
import { useAgentStore } from '../store/useAgentStore';

interface Message {
  role: 'user' | 'agent';
  content: string;
  thought?: string;
  isStreaming?: boolean;
}

export function Agents() {
  const { agents, activeAgent, setActiveAgent, fetchAgents, loading } = useAgentStore();
  const [seeding, setSeeding] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thought, setThought] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thought]);

  const handleSeedDeus = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/agents/seed', { method: 'POST' });
      if (response.ok) {
        await fetchAgents();
      }
    } catch (error) {
      console.error('Failed to seed Deus:', error);
    } finally {
      setSeeding(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeAgent || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);
    setThought('Gerando embedding da consulta...');

    try {
      const embedding = await generateEmbedding(userMessage);
      
      setThought('Buscando memórias relevantes (RAG)...');
      const searchResponse = await fetch('/api/agents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          embedding, 
          agentId: activeAgent.id,
          limit: 3 
        })
      });
      const memories = await searchResponse.json();
      
      const context = memories.map((m: any) => m.content).join('\n---\n');
      
      setThought('Processando resposta com Gemini...');
      const systemPrompt = `
        Você é o agente "${activeAgent.name}".
        Tipo: ${activeAgent.type}
        Persona: ${activeAgent.persona}
        Escopo: ${activeAgent.scope}
        Metas: ${activeAgent.goals}
        Instruções: ${activeAgent.instructions}
        
        Contexto Recuperado (Memórias):
        ${context || 'Nenhuma memória relevante encontrada.'}
        
        Responda ao Thomas de forma ultra-profissional, focada em escala e visão bilionária.
        Mantenha a resposta concisa e estratégica.
      `;

      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt
        }
      });

      setIsThinking(false);
      setThought('');
      
      // Add empty agent message for streaming
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: '',
        isStreaming: true,
        thought: `Contexto usado: ${memories.length} memórias encontradas.`
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
      console.error('Chat error:', error);
      setIsThinking(false);
      setThought('');
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: 'Erro crítico no motor de inteligência.' 
      }]);
    }
  };

  const handleLearn = async () => {
    if (!activeAgent) return;
    const content = prompt('O que este agente deve aprender agora?');
    if (!content) return;

    setSeeding(true);
    try {
      const embedding = await generateEmbedding(content);
      await fetch(`/api/agents/${activeAgent.id}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, embedding })
      });
      alert('Memória salva com sucesso!');
    } catch (error) {
      console.error('Failed to learn:', error);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950 text-zinc-300 overflow-hidden">
      {/* Sidebar Hierárquica Refinada */}
      <aside className="w-72 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex flex-col">
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Linhagem de IA</h2>
            <button 
              onClick={fetchAgents}
              className="p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-200"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Buscar agente..." 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* System Agents Section */}
          <div>
            <h3 className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Sistema</h3>
            <div className="space-y-1">
              {agents.filter(a => a.type === 'system').map((agent) => (
                <AgentNavItem 
                  key={agent.id} 
                  agent={agent} 
                  isActive={activeAgent?.id === agent.id} 
                  onClick={() => { setActiveAgent(agent); setMessages([]); }} 
                />
              ))}
              {agents.filter(a => a.type === 'system').length === 0 && !loading && (
                <button 
                  onClick={handleSeedDeus}
                  disabled={seeding}
                  className="w-full py-3 border border-dashed border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded-lg hover:bg-indigo-500/5 transition-all flex flex-col items-center gap-2"
                >
                  <Zap size={16} />
                  INICIALIZAR DEUS
                </button>
              )}
            </div>
          </div>

          {/* Project Agents Section */}
          <div>
            <h3 className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Projetos</h3>
            <div className="space-y-1">
              {agents.filter(a => a.type === 'project').map((agent) => (
                <AgentNavItem 
                  key={agent.id} 
                  agent={agent} 
                  isActive={activeAgent?.id === agent.id} 
                  onClick={() => { setActiveAgent(agent); setMessages([]); }} 
                />
              ))}
              {agents.filter(a => a.type === 'project').length === 0 && (
                <p className="px-3 text-[10px] text-zinc-700 italic">Nenhum agente de projeto.</p>
              )}
            </div>
          </div>

          {/* Task Agents Section */}
          <div>
            <h3 className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Tarefas</h3>
            <div className="space-y-1">
              {agents.filter(a => a.type === 'task').map((agent) => (
                <AgentNavItem 
                  key={agent.id} 
                  agent={agent} 
                  isActive={activeAgent?.id === agent.id} 
                  onClick={() => { setActiveAgent(agent); setMessages([]); }} 
                />
              ))}
              {agents.filter(a => a.type === 'task').length === 0 && (
                <p className="px-3 text-[10px] text-zinc-700 italic">Nenhum agente de tarefa.</p>
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-200 truncate">Thomas Gabriel</p>
              <p className="text-[10px] text-zinc-500 truncate">Visionário Bilionário</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal - Dossiê e Chat */}
      <main className="flex-1 flex overflow-hidden">
        {activeAgent ? (
          <>
            <div className="flex-1 overflow-y-auto border-r border-zinc-800 bg-zinc-950/30">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={activeAgent.id}
                className="p-10 max-w-5xl mx-auto"
              >
                {/* Header do Agente */}
                <div className="flex items-start justify-between mb-12">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.2em] border",
                        activeAgent.type === 'system' 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}>
                        {activeAgent.type}
                      </div>
                      <div className="h-4 w-[1px] bg-zinc-800" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Sincronizado</span>
                      </div>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-6 font-display">
                      {activeAgent.name}
                    </h1>
                    <p className="text-zinc-400 text-xl leading-relaxed max-w-2xl font-light">
                      {activeAgent.description}
                    </p>
                  </div>
                  <div className="relative">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 bg-indigo-500 blur-3xl rounded-full"
                    />
                    <motion.div 
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className="relative w-24 h-24 bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 rounded-3xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-2xl backdrop-blur-xl"
                    >
                      <Bot size={48} strokeWidth={1.5} />
                    </motion.div>
                  </div>
                </div>

                {/* DNA Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                  <DNACard icon={<Shield size={20} />} title="Escopo Operacional" content={activeAgent.scope} color="indigo" />
                  <DNACard icon={<Cpu size={20} />} title="Arquétipo de Persona" content={activeAgent.persona} color="emerald" />
                  <DNACard icon={<Target size={20} />} title="Diretrizes Estratégicas" content={activeAgent.goals} color="amber" />
                  <DNACard icon={<Zap size={20} />} title="Protocolos de Execução" content={activeAgent.instructions} color="rose" />
                </div>

                {/* Indicadores de Elite (Fase 4) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BrainCircuit size={120} />
                    </div>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8">Nível de Consciência</h3>
                    <div className="flex items-end gap-4 h-32 mb-6">
                      {[65, 82, 45, 95, 70, 88, 92].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${val}%` }}
                            transition={{ delay: i * 0.1, duration: 1 }}
                            className={cn(
                              "w-full rounded-t-lg relative group/bar",
                              i === 6 ? "bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" : "bg-zinc-800 hover:bg-zinc-700"
                            )}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                              {val}%
                            </div>
                          </motion.div>
                          <span className="text-[8px] font-bold text-zinc-600">T-{6-i}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span className="text-xs font-bold text-zinc-200">Sincronia Ativa: 92%</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">ESTÁVEL</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center justify-center relative group">
                    <h3 className="absolute top-8 left-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Escopo de Domínio</h3>
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-zinc-800/50"
                        />
                        <motion.circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={502}
                          initial={{ strokeDashoffset: 502 }}
                          animate={{ strokeDashoffset: 502 - (502 * 0.75) }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          className="text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white tracking-tighter">75%</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Cobertura</span>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-zinc-400">Ativo</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                        <span className="text-[10px] text-zinc-400">Latente</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção de Inteligência */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 text-zinc-100 font-bold text-sm">
                          <Database size={20} className="text-indigo-400" />
                          <span>Memória</span>
                        </div>
                        <button 
                          onClick={handleLearn}
                          className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition-all"
                        >
                          <BrainCircuit size={18} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          <span>Status RAG</span>
                          <span className="text-emerald-500">Online</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                          "O agente recupera fragmentos de conhecimento em tempo real para embasar decisões estratégicas."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-black/40 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-zinc-100 font-bold text-sm">
                          <Network size={20} className="text-emerald-400" />
                          <span>Fluxo de Pensamento</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                          <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                          <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                        </div>
                      </div>
                      <div className="flex-1 font-mono text-[11px] text-zinc-500 space-y-2 bg-black/40 p-4 rounded-xl border border-zinc-800/30 overflow-y-auto max-h-48 custom-scrollbar">
                        <p className="text-emerald-500/70">{`> [SYSTEM] Agente ${activeAgent.name} em prontidão.`}</p>
                        <p className="text-zinc-600">{`> [INFO] Sincronizando com banco de dados vetorial...`}</p>
                        <AnimatePresence>
                          {isThinking && (
                            <motion.p 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-indigo-400"
                            >
                              {`> [PROCESS] ${thought}`}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        {!isThinking && <p className="animate-pulse text-indigo-500/50">{`> Aguardando comando...`}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Chat Interface de Elite */}
            <div className="w-[400px] flex flex-col bg-zinc-900/10 backdrop-blur-md">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-100">Canal Seguro</span>
                </div>
                <button className="text-zinc-500 hover:text-zinc-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                    <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border border-zinc-700/50">
                      <MessageSquare size={32} className="text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-200 mb-2">Comunicação Estratégica</h3>
                    <p className="text-[11px] leading-relaxed">
                      Inicie um diálogo com o {activeAgent.name} para alinhar sua visão bilionária.
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={cn(
                      "flex flex-col gap-2",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-xl relative overflow-hidden",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10" 
                        : "bg-zinc-800/80 text-zinc-200 rounded-tl-none border border-zinc-700/50 backdrop-blur-sm"
                    )}>
                      {msg.content}
                      {msg.isStreaming && (
                        <motion.span 
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 translate-y-0.5"
                        />
                      )}
                    </div>
                    {msg.thought && (
                      <span className="text-[9px] text-zinc-600 font-mono px-2 uppercase tracking-widest">{msg.thought}</span>
                    )}
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-zinc-950/50 border-t border-zinc-800">
                <form onSubmit={handleSendMessage} className="relative group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua diretriz..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-5 pr-12 py-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                  />
                  <button 
                    type="submit"
                    disabled={isThinking || !input.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-indigo-400 disabled:opacity-30 transition-all hover:scale-110"
                  >
                    <Send size={20} />
                  </button>
                </form>
                <p className="mt-4 text-[9px] text-center text-zinc-600 uppercase tracking-widest font-bold">
                  Criptografia de Ponta a Ponta • Life Thomas OS
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-2 border-dashed border-zinc-800 rounded-full flex items-center justify-center text-zinc-800 mb-8"
            >
              <Bot size={40} />
            </motion.div>
            <h2 className="text-2xl font-black text-zinc-100 mb-3 tracking-tight">AGUARDANDO SELEÇÃO</h2>
            <p className="text-zinc-500 max-w-xs text-sm font-light leading-relaxed">
              Selecione uma entidade na linhagem para acessar o núcleo de inteligência correspondente.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

interface AgentNavItemProps {
  agent: any;
  isActive: boolean;
  onClick: () => void;
  key?: React.Key;
}

function AgentNavItem({ agent, isActive, onClick }: AgentNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all group relative overflow-hidden",
        isActive 
          ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
          : "hover:bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-transparent"
      )}
    >
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" 
        />
      )}
      <div className={cn(
        "w-2 h-2 rounded-full transition-all duration-500",
        agent.type === 'system' 
          ? (isActive ? "bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" : "bg-indigo-900") 
          : (isActive ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-emerald-900")
      )} />
      <span className="truncate flex-1 text-left font-bold tracking-tight">{agent.name}</span>
      <ChevronRight size={14} className={cn(
        "transition-all duration-300",
        isActive ? "rotate-90 text-indigo-400" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
      )} />
    </button>
  );
}

function DNACard({ icon, title, content, color }: { icon: React.ReactNode, title: string, content: string, color: string }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30",
    emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30",
    amber: "text-amber-400 bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30",
    rose: "text-rose-400 bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn("p-6 rounded-2xl border transition-all backdrop-blur-sm", colors[color])}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-black/20">
          {icon}
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">{title}</h3>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed font-light">
        {content || "Protocolo não definido pelo sistema."}
      </p>
    </motion.div>
  );
}
