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
  TrendingUp,
  Plus,
  RefreshCw,
  Send,
  BrainCircuit,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ai, generateEmbedding } from '../lib/gemini';
import { useAgentStore } from '../store/useAgentStore';

const PersonaBackground = ({ type }: { type: string }) => {
  if (type === 'system') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none persona-deus">
        <div className="absolute inset-0 bg-dots" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-persona-accent/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-persona-accent/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
      </div>
    );
  }
  if (type === 'task' || type === 'project') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none persona-executor">
        <div className="absolute top-0 left-0 w-full h-1 bg-persona-accent/30" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-persona-accent/30" />
        <div className="absolute top-0 left-0 w-full overflow-hidden h-6 bg-persona-accent/10 border-b border-persona-accent/20">
          <div className="marquee-text text-[10px] font-mono font-bold text-persona-accent/40 py-1">
            EXECUTING SYSTEM DIRECTIVES • OPTIMIZING LATENCY • SCALING INFRASTRUCTURE • EXECUTING SYSTEM DIRECTIVES • OPTIMIZING LATENCY • SCALING INFRASTRUCTURE • 
          </div>
        </div>
      </div>
    );
  }
  if (type === 'director') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none persona-diretor">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(var(--persona-accent) 1px, transparent 1px), linear-gradient(90deg, var(--persona-accent) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    );
  }
  return null;
};

interface Message {
  role: 'user' | 'agent';
  content: string;
  thought?: string;
  cognitiveSteps?: string[];
  isStreaming?: boolean;
}

export function Agents() {
  const { agents, activeAgent, setActiveAgent, fetchAgents, syncAgents, loading } = useAgentStore();
  const [seeding, setSeeding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thought, setThought] = useState('');
  const [cognitiveSteps, setCognitiveSteps] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    syncAgents();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thought]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncAgents();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeAgent || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);
    const initialStep = 'Gerando embedding da consulta...';
    setThought(initialStep);
    setCognitiveSteps([initialStep]);

    try {
      const embedding = await generateEmbedding(userMessage);
      
      const step2 = 'Buscando memórias locais...';
      setThought(step2);
      setCognitiveSteps(prev => [...prev, step2]);
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
      let context = memories.map((m: any) => m.content).join('\n---\n');

      if (activeAgent.parentId) {
        const parentAgent = agents.find(a => a.id === activeAgent.parentId);
        if (parentAgent) {
          const step3 = `Consultando superior: ${parentAgent.name}...`;
          setThought(step3);
          setCognitiveSteps(prev => [...prev, step3]);
          const parentSearchResponse = await fetch('/api/agents/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              embedding, 
              agentId: parentAgent.id,
              limit: 2 
            })
          });
          const parentMemories = await parentSearchResponse.json();
          const parentContext = parentMemories.map((m: any) => m.content).join('\n---\n');
          
          context = `
CONTEXTO DO SUPERIOR (${parentAgent.name}):
${parentContext || 'Sem memórias adicionais do superior.'}
---
CONTEXTO LOCAL (${activeAgent.name}):
${context}
          `;
        }
      }
      
      const step4 = 'Sincronizando com Gemini...';
      setThought(step4);
      setCognitiveSteps(prev => [...prev, step4]);
      const systemPrompt = `
        Você é o agente "${activeAgent.name}".
        Tipo: ${activeAgent.type}
        Persona: ${activeAgent.persona}
        Escopo: ${activeAgent.scope}
        Metas: ${activeAgent.goals}
        Instruções: ${activeAgent.instructions}
        
        PROTOCOLO DE BRIEFING ATIVO:
        Você deve agir em total alinhamento com seu superior imediato.
        
        Contexto Integrado (Memórias):
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
      const finalSteps = [...cognitiveSteps, 'Gerando resposta estratégica...'];
      setCognitiveSteps([]);
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: '',
        isStreaming: true,
        thought: `Contexto usado: ${memories.length} memórias encontradas.`,
        cognitiveSteps: finalSteps
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
    <div className="flex h-[calc(100vh-80px)] bg-app-bg text-app-text-dim overflow-hidden">
      {/* Sidebar Hierárquica Refinada */}
      <aside className="w-80 border-r border-app-border bg-app-card/50 backdrop-blur-xl flex flex-col">
        <div className="p-6 border-b border-app-border">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-black text-app-fg tracking-tighter flex items-center gap-2">
              <Network className="text-app-accent" size={24} />
              LINHAGEM
            </h1>
            <button 
              onClick={handleSync}
              disabled={isSyncing || loading}
              className={cn(
                "p-2 rounded-xl bg-app-bg border border-app-border text-app-text-dim hover:text-app-accent hover:border-app-accent/30 transition-all",
                (isSyncing || loading) && "animate-spin"
              )}
              title="Sincronizar Hierarquia"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-dim/50" />
            <input 
              type="text" 
              placeholder="Buscar consciência..." 
              className="input-elite pl-9 py-2 text-xs"
            />
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar relative">
          <div className="absolute left-7 top-8 bottom-8 w-[1px] bg-gradient-to-b from-app-accent/50 via-emerald-500/50 via-amber-500/50 to-rose-500/50 opacity-20" />
          
          {/* Nível 1: DEUS */}
          <div className="space-y-3">
            <h2 className="px-4 text-[9px] font-black text-app-text-dim uppercase tracking-[0.3em]">Nível 01: Sistema</h2>
            <div className="space-y-1">
              {agents.filter(a => a.type === 'system').map((agent) => (
                <AgentNavItem 
                  key={agent.id} 
                  agent={agent} 
                  isActive={activeAgent?.id === agent.id} 
                  onClick={() => { setActiveAgent(agent); setMessages([]); }} 
                />
              ))}
            </div>
          </div>

          {/* Nível 2: DIRETORES */}
          <div className="space-y-3">
            <h2 className="px-4 text-[9px] font-black text-app-text-dim uppercase tracking-[0.3em]">Nível 02: Diretores</h2>
            <div className="space-y-1">
              {agents.filter(a => a.type === 'director').map((agent) => (
                <AgentNavItem 
                  key={agent.id} 
                  agent={agent} 
                  isActive={activeAgent?.id === agent.id} 
                  onClick={() => { setActiveAgent(agent); setMessages([]); }} 
                />
              ))}
            </div>
          </div>

          {/* Nível 3: GERENTES */}
          <div className="space-y-3">
            <h2 className="px-4 text-[9px] font-black text-app-text-dim uppercase tracking-[0.3em]">Nível 03: Projetos</h2>
            <div className="space-y-1">
              {agents.filter(a => a.type === 'project').map((agent) => (
                <AgentNavItem 
                  key={agent.id} 
                  agent={agent} 
                  isActive={activeAgent?.id === agent.id} 
                  onClick={() => { setActiveAgent(agent); setMessages([]); }} 
                />
              ))}
            </div>
          </div>

          {/* Nível 4: EXECUTORES */}
          <div className="space-y-3">
            <h2 className="px-4 text-[9px] font-black text-app-text-dim uppercase tracking-[0.3em]">Nível 04: Tarefas</h2>
            <div className="space-y-1">
              {agents.filter(a => a.type === 'task').map((agent) => (
                <AgentNavItem 
                  key={agent.id} 
                  agent={agent} 
                  isActive={activeAgent?.id === agent.id} 
                  onClick={() => { setActiveAgent(agent); setMessages([]); }} 
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-app-border bg-app-bg/50">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-app-accent/5 border border-app-accent/10">
            <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-app-fg truncate">Thomas Gabriel</p>
              <p className="text-[10px] text-app-text-dim truncate">Visionário Bilionário</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal - Dossiê e Chat */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeAgent ? (
          <>
            <div className={cn(
              "flex-1 overflow-y-auto border-r border-app-border bg-app-bg/30 relative",
              activeAgent.type === 'system' && "persona-deus",
              activeAgent.type === 'director' && "persona-diretor",
              (activeAgent.type === 'project' || activeAgent.type === 'task') && "persona-executor"
            )}>
              <PersonaBackground type={activeAgent.type} />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={activeAgent.id}
                className="p-10 max-w-5xl mx-auto relative z-10"
              >
                {/* Header do Agente */}
                <div className="flex items-start justify-between mb-12">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.2em] border",
                        activeAgent.type === 'system' && "bg-persona-accent/10 text-persona-accent border-persona-accent/20",
                        activeAgent.type === 'director' && "bg-persona-accent/10 text-persona-accent border-persona-accent/20",
                        activeAgent.type === 'project' && "bg-persona-accent/10 text-persona-accent border-persona-accent/20",
                        activeAgent.type === 'task' && "bg-persona-accent/10 text-persona-accent border-persona-accent/20"
                      )}>
                        {activeAgent.type === 'system' ? 'Nível 01: Sistema' : 
                         activeAgent.type === 'director' ? 'Nível 02: Diretor' :
                         activeAgent.type === 'project' ? 'Nível 03: Projeto' : 'Nível 04: Tarefa'}
                      </div>
                      <div className="h-4 w-[1px] bg-app-border" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-[10px] text-app-text-dim font-bold uppercase tracking-widest">Sincronizado</span>
                      </div>
                    </div>
                    <h1 className={cn(
                      "text-5xl font-black text-app-fg tracking-tighter mb-6 font-display",
                      (activeAgent.type === 'project' || activeAgent.type === 'task') && "italic uppercase"
                    )}>
                      {activeAgent.name}
                    </h1>
                    <p className="text-app-text-dim text-xl leading-relaxed max-w-2xl font-light italic font-serif">
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
                      className="absolute inset-0 bg-persona-accent blur-3xl rounded-full"
                    />
                    <motion.div 
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className={cn(
                        "relative w-24 h-24 bg-app-card rounded-3xl border border-app-border flex items-center justify-center text-persona-accent shadow-2xl backdrop-blur-xl",
                        (activeAgent.type === 'project' || activeAgent.type === 'task') && "brutal-border"
                      )}
                    >
                      {activeAgent.type === 'system' ? <Zap size={48} strokeWidth={1.5} /> :
                       activeAgent.type === 'director' ? <Shield size={48} strokeWidth={1.5} /> :
                       <Cpu size={48} strokeWidth={1.5} />}
                    </motion.div>
                  </div>
                </div>

                {/* DNA Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                  <DNACard 
                    icon={<Shield size={20} />} 
                    title="Escopo Operacional" 
                    content={activeAgent.scope} 
                    className={cn(
                      activeAgent.type === 'system' && "glass-persona border-persona-accent/20",
                      (activeAgent.type === 'project' || activeAgent.type === 'task') && "brutal-border"
                    )}
                  />
                  <DNACard 
                    icon={<Cpu size={20} />} 
                    title="Arquétipo de Persona" 
                    content={activeAgent.persona} 
                    className={cn(
                      activeAgent.type === 'system' && "glass-persona border-persona-accent/20",
                      (activeAgent.type === 'project' || activeAgent.type === 'task') && "brutal-border"
                    )}
                  />
                  <DNACard 
                    icon={<Target size={20} />} 
                    title="Diretrizes Estratégicas" 
                    content={activeAgent.goals} 
                    className={cn(
                      activeAgent.type === 'system' && "glass-persona border-persona-accent/20",
                      (activeAgent.type === 'project' || activeAgent.type === 'task') && "brutal-border"
                    )}
                  />
                  <DNACard 
                    icon={<Zap size={20} />} 
                    title="Protocolos de Execução" 
                    content={activeAgent.instructions} 
                    className={cn(
                      activeAgent.type === 'system' && "glass-persona border-persona-accent/20",
                      (activeAgent.type === 'project' || activeAgent.type === 'task') && "brutal-border"
                    )}
                  />
                </div>

                {/* Indicadores de Elite */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bento-grid-item p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BrainCircuit size={120} />
                    </div>
                    <h3 className="text-[10px] font-black text-app-text-dim uppercase tracking-[0.3em] mb-8">Nível de Consciência</h3>
                    <div className="flex items-end gap-4 h-32 mb-6">
                      {[65, 82, 45, 95, 70, 88, 92].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${val}%` }}
                            transition={{ delay: i * 0.1, duration: 1 }}
                            className={cn(
                              "w-full rounded-t-lg relative group/bar",
                              i === 6 ? "bg-app-accent shadow-glow-accent" : "bg-app-border hover:bg-app-text-dim/20"
                            )}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-app-card text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity border border-app-border">
                              {val}%
                            </div>
                          </motion.div>
                          <span className="text-[8px] font-bold text-app-text-dim">T-{6-i}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-app-accent animate-ping" />
                        <span className="text-xs font-bold text-app-fg">Sincronia Ativa: 92%</span>
                      </div>
                      <span className="text-[10px] text-app-text-dim font-mono">ESTÁVEL</span>
                    </div>
                  </div>

                  <div className="bento-grid-item p-8 flex flex-col items-center justify-center relative group">
                    <h3 className="absolute top-8 left-8 text-[10px] font-black text-app-text-dim uppercase tracking-[0.3em]">Escopo de Domínio</h3>
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-app-border"
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
                          className="text-emerald-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-app-fg tracking-tighter">75%</span>
                        <span className="text-[9px] font-bold text-app-text-dim uppercase tracking-widest">Cobertura</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção de Inteligência */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bento-grid-item p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 text-app-fg font-bold text-sm">
                          <Database size={20} className="text-app-accent" />
                          <span>Memória</span>
                        </div>
                        <button 
                          onClick={handleLearn}
                          className="p-2 bg-app-accent/10 hover:bg-app-accent/20 text-app-accent rounded-xl border border-app-accent/20 transition-all"
                        >
                          <BrainCircuit size={18} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-app-text-dim uppercase tracking-widest">
                          <span>Status RAG</span>
                          <span className="text-emerald-500">Online</span>
                        </div>
                        <div className="h-1.5 w-full bg-app-border rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-app-accent shadow-glow-accent" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bento-grid-item p-6 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-app-fg font-bold text-sm">
                          <Network size={20} className="text-emerald-400" />
                          <span>Fluxo de Pensamento</span>
                        </div>
                      </div>
                      <div className="flex-1 font-mono text-[11px] text-app-text-dim space-y-2 bg-app-bg/50 p-4 rounded-xl border border-app-border overflow-y-auto max-h-48 custom-scrollbar">
                        <p className="text-emerald-500/70">{`> [SYSTEM] Agente ${activeAgent.name} em prontidão.`}</p>
                        <p className="text-app-text-dim/60">{`> [INFO] Sincronizando com banco de dados vetorial...`}</p>
                        <AnimatePresence>
                          {isThinking && (
                            <motion.p 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-app-accent"
                            >
                              {`> [PROCESS] ${thought}`}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        {!isThinking && <p className="animate-pulse text-app-accent/50">{`> Aguardando comando...`}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Chat Interface de Elite */}
            <div className={cn(
              "w-[450px] flex flex-col bg-app-card/20 backdrop-blur-md border-l border-app-border relative",
              activeAgent.type === 'system' && "persona-deus",
              activeAgent.type === 'director' && "persona-diretor",
              (activeAgent.type === 'project' || activeAgent.type === 'task') && "persona-executor"
            )}>
              <div className="p-6 border-b border-app-border flex items-center justify-between bg-app-card/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-persona-accent rounded-full shadow-glow-accent animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-app-fg">Córtex de Consciência</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-app-text-dim uppercase tracking-widest">Latência: 14ms</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                    <div className="w-20 h-20 rounded-full bg-app-card flex items-center justify-center mb-6 border border-app-border">
                      <MessageSquare size={32} className="text-app-text-dim" />
                    </div>
                    <h3 className="text-sm font-bold text-app-fg mb-2 uppercase tracking-widest">Protocolo de Comunicação</h3>
                    <p className="text-[11px] leading-relaxed">
                      Inicie um diálogo com o {activeAgent.name} para alinhar sua visão estratégica.
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={cn(
                      "flex flex-col gap-3",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    {msg.role === 'agent' && msg.cognitiveSteps && (
                      <div className="w-full max-w-[85%] space-y-1 mb-1">
                        <div className="flex items-center gap-2 px-2">
                          <BrainCircuit size={10} className="text-persona-accent" />
                          <span className="text-[8px] font-black text-app-text-dim uppercase tracking-widest">Processamento Cognitivo</span>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3 border border-app-border/30 space-y-1.5">
                          {msg.cognitiveSteps.map((step, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              key={idx} 
                              className="flex items-center gap-2 text-[9px] font-mono text-app-text-dim/60"
                            >
                              <span className="text-persona-accent">✓</span>
                              {step}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[90%] p-5 rounded-2xl text-[13px] leading-relaxed shadow-2xl relative overflow-hidden group/msg",
                      msg.role === 'user' 
                        ? "bg-persona-accent text-white rounded-tr-none shadow-glow-accent" 
                        : cn(
                          "bg-app-card text-app-fg rounded-tl-none border border-app-border backdrop-blur-sm",
                          (activeAgent.type === 'project' || activeAgent.type === 'task') && "brutal-border"
                        )
                    )}>
                      {msg.role === 'agent' && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-persona-accent opacity-20" />
                      )}
                      <div className="relative z-10">
                        {msg.content}
                        {msg.isStreaming && (
                          <motion.span 
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-1.5 h-4 bg-persona-accent ml-1 translate-y-0.5"
                          />
                        )}
                      </div>
                    </div>
                    
                    {msg.thought && (
                      <div className="flex items-center gap-2 px-3">
                        <div className="w-1 h-1 rounded-full bg-persona-accent" />
                        <span className="text-[9px] text-app-text-dim font-mono uppercase tracking-widest opacity-60">{msg.thought}</span>
                      </div>
                    )}
                  </motion.div>
                ))}

                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-3 items-start"
                  >
                    <div className="w-full max-w-[85%] space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <RefreshCw size={10} className="text-persona-accent animate-spin" />
                        <span className="text-[8px] font-black text-app-text-dim uppercase tracking-widest">Sincronizando Consciência...</span>
                      </div>
                      <div className="bg-black/20 rounded-lg p-4 border border-persona-accent/20 space-y-2">
                        {cognitiveSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[9px] font-mono text-persona-accent">
                            <span className="animate-pulse">●</span>
                            {step}
                          </div>
                        ))}
                        <motion.div 
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="h-1 w-full bg-persona-accent/10 rounded-full overflow-hidden"
                        >
                          <div className="h-full w-1/3 bg-persona-accent animate-[shimmer_2s_infinite]" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-app-card/50 border-t border-app-border">
                <form onSubmit={handleSendMessage} className="relative group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Comandar ${activeAgent.name}...`}
                    className={cn(
                      "w-full bg-app-bg border border-app-border rounded-2xl pl-5 pr-14 py-4 text-sm text-app-fg placeholder:text-app-text-dim/30 focus:ring-2 focus:ring-persona-accent focus:border-transparent transition-all",
                      (activeAgent.type === 'project' || activeAgent.type === 'task') && "brutal-border"
                    )}
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all",
                      input.trim() && !isThinking 
                        ? "bg-persona-accent text-white shadow-glow-accent hover:scale-105" 
                        : "bg-app-bg text-app-text-dim opacity-50"
                    )}
                  >
                    <Send size={18} />
                  </button>
                </form>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-bold text-app-text-dim uppercase tracking-widest">Criptografia Ativa</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-app-text-dim/20" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-app-text-dim uppercase tracking-widest">Gemini 3.0 Flash</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-12 bg-app-bg">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="flex items-end justify-between border-b border-app-border pb-8">
                <div>
                  <h1 className="text-4xl font-display font-black text-app-fg tracking-tighter">MAPA DE CONSCIÊNCIA</h1>
                  <p className="text-app-text-dim mt-2">Gerencie a linhagem de inteligência do seu império.</p>
                </div>
                <button 
                  onClick={handleSync}
                  className="btn-elite flex items-center gap-2"
                >
                  <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                  Sincronizar Linhagem
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => {
                  const personaClass = agent.type === 'system' ? 'persona-deus' : agent.type === 'director' ? 'persona-diretor' : 'persona-executor';
                  return (
                    <motion.button
                      key={agent.id}
                      whileHover={{ y: -5, scale: 1.02 }}
                      onClick={() => { setActiveAgent(agent); setMessages([]); }}
                      className={cn(
                        "bento-grid-item p-8 text-left group flex flex-col h-full relative overflow-hidden",
                        agent.type === 'system' && "md:col-span-2 lg:col-span-1 border-persona-accent/20",
                        personaClass
                      )}
                    >
                      <PersonaBackground type={agent.type} />
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110",
                            "bg-persona-accent/10 text-persona-accent border-persona-accent/20"
                          )}>
                            {agent.type === 'system' ? <Shield size={24} /> : 
                             agent.type === 'director' ? <TrendingUp size={24} /> :
                             agent.type === 'project' ? <Target size={24} /> : <Zap size={24} />}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black text-app-text-dim uppercase tracking-widest">Ativo</span>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-app-text-dim uppercase tracking-[0.2em] mb-2">
                            {agent.type === 'system' ? 'Nível 01: Sistema' : 
                             agent.type === 'director' ? 'Nível 02: Diretor' :
                             agent.type === 'project' ? 'Nível 03: Projeto' : 'Nível 04: Tarefa'}
                          </p>
                          <h3 className={cn(
                            "text-2xl font-display font-bold text-app-fg mb-3 group-hover:text-persona-accent transition-colors",
                            (agent.type === 'project' || agent.type === 'task') && "italic uppercase"
                          )}>
                            {agent.name}
                          </h3>
                          <p className="text-xs text-app-text-dim leading-relaxed line-clamp-3">
                            {agent.description}
                          </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-app-border flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-6 h-6 rounded-full bg-app-bg border border-app-border flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-persona-accent" />
                              </div>
                            ))}
                          </div>
                          <ChevronRight size={18} className="text-app-text-dim group-hover:text-app-fg group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
                
                {agents.length === 0 && (
                  <div className="col-span-full py-32 bento-grid-item border-dashed flex flex-col items-center justify-center text-app-text-dim">
                    <Bot size={64} className="mb-6 opacity-10" />
                    <h3 className="text-xl font-bold text-app-fg mb-2">Nenhuma Entidade Detectada</h3>
                    <p className="text-sm mb-8">Inicialize o sistema para manifestar a linhagem de agentes.</p>
                    <button onClick={handleSync} className="btn-elite">Inicializar Sistema</button>
                  </div>
                )}
              </div>
            </div>
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
  const { agents } = useAgentStore();
  const getIconColor = () => {
    switch (agent.type) {
      case 'system': return isActive ? "bg-persona-accent shadow-glow-accent" : "bg-persona-accent/20";
      case 'director': return isActive ? "bg-persona-accent shadow-glow-accent" : "bg-persona-accent/20";
      case 'project': return isActive ? "bg-persona-accent shadow-glow-accent" : "bg-persona-accent/20";
      case 'task': return isActive ? "bg-persona-accent shadow-glow-accent" : "bg-persona-accent/20";
      default: return "bg-app-border";
    }
  };

  const personaClass = agent.type === 'system' ? 'persona-deus' : agent.type === 'director' ? 'persona-diretor' : 'persona-executor';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all group relative overflow-hidden",
        isActive 
          ? "bg-app-accent/10 text-app-accent border border-app-accent/20" 
          : "hover:bg-app-card text-app-text-dim hover:text-app-fg border border-transparent",
        agent.type === 'director' && "ml-2 w-[calc(100%-0.5rem)]",
        agent.type === 'project' && "ml-4 w-[calc(100%-1rem)]",
        agent.type === 'task' && "ml-6 w-[calc(100%-1.5rem)]",
        personaClass
      )}
    >
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute left-0 w-1 h-6 bg-persona-accent rounded-r-full" 
        />
      )}
      <div className={cn("w-2 h-2 rounded-full transition-all duration-500", getIconColor())} />
      <div className="flex-1 min-w-0 text-left">
        <span className="block truncate font-bold tracking-tight">{agent.name}</span>
        {agent.parentId && (
          <span className="block text-[8px] text-app-text-dim/60 uppercase tracking-widest mt-0.5">
            Subordinado a: {agents.find(a => a.id === agent.parentId)?.name || 'Desconhecido'}
          </span>
        )}
      </div>
      <ChevronRight size={14} className={cn(
        "transition-all duration-300",
        isActive ? "rotate-90 text-app-accent" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
      )} />
    </button>
  );
}

function DNACard({ icon, title, content, className }: { icon: React.ReactNode, title: string, content: string, className?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "p-6 rounded-2xl border transition-all backdrop-blur-sm bg-app-card/50 border-app-border",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-black/20 text-persona-accent">
          {icon}
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-fg">{title}</h3>
      </div>
      <p className="text-xs text-app-text-dim leading-relaxed font-light">
        {content || "Protocolo não definido pelo sistema."}
      </p>
    </motion.div>
  );
}
