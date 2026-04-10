import { create } from 'zustand';

interface Agent {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  linkedId: number | null;
  description: string;
  persona: string;
  scope: string;
  goals: string;
  instructions: string;
  status: string;
}

interface AgentStore {
  agents: Agent[];
  activeAgent: Agent | null;
  loading: boolean;
  setAgents: (agents: Agent[]) => void;
  setActiveAgent: (agent: Agent | null) => void;
  setLoading: (loading: boolean) => void;
  fetchAgents: () => Promise<void>;
  switchContext: (type: 'system' | 'project' | 'task', linkedId?: number) => void;
  getAgentByContext: (type: string, id?: number) => Agent | null;
  notifyChange: (message: string) => void;
  lastEvent: string | null;
}

const consciousnessChannel = new BroadcastChannel('agent_consciousness');

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  activeAgent: null,
  loading: false,
  lastEvent: null,
  setAgents: (agents) => set({ agents }),
  setActiveAgent: (activeAgent) => set({ activeAgent }),
  setLoading: (loading) => set({ loading }),
  fetchAgents: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      const agentsList = Array.isArray(data) ? data : [];
      set({ agents: agentsList });
      if (agentsList.length > 0 && !get().activeAgent) {
        // Default to Deus (system agent)
        const deus = agentsList.find((a: Agent) => a.type === 'system');
        set({ activeAgent: deus || agentsList[0] });
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      set({ loading: false });
    }
  },
  switchContext: (type, linkedId) => {
    const { agents } = get();
    let targetAgent = null;

    if (type === 'system') {
      targetAgent = agents.find(a => a.type === 'system');
    } else {
      targetAgent = agents.find(a => a.type === type && a.linkedId === linkedId);
    }

    if (targetAgent) {
      set({ activeAgent: targetAgent });
    } else {
      // Fallback to Deus if context agent not found
      const deus = agents.find(a => a.type === 'system');
      if (deus) set({ activeAgent: deus });
    }
  },
  getAgentByContext: (type, id) => {
    const { agents } = get();
    if (type === 'system') return agents.find(a => a.type === 'system') || null;
    return agents.find(a => a.type === type && a.linkedId === id) || null;
  },
  notifyChange: (message) => {
    set({ lastEvent: message });
    consciousnessChannel.postMessage({ type: 'CHANGE', message });
    setTimeout(() => set({ lastEvent: null }), 4000);
  }
}));

// Listen for consciousness events from other tabs
consciousnessChannel.onmessage = (event) => {
  if (event.data.type === 'CHANGE') {
    useAgentStore.getState().fetchAgents();
    useAgentStore.setState({ lastEvent: event.data.message });
    setTimeout(() => useAgentStore.setState({ lastEvent: null }), 4000);
  }
};
