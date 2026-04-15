import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Checklist } from './pages/Checklist';
import { Hoje } from './pages/Hoje';
import { Agents } from './pages/Agents';
import { Team } from './pages/Team';
import { MemberDetail } from './pages/MemberDetail';
import { Strategy } from './pages/Strategy';
import { GoalDetail } from './pages/GoalDetail';
import { GlobalAgentAssistant } from './components/agents/GlobalAgentAssistant';
import { useSidebarStore } from './store/useSidebarStore';

function App() {
  const location = useLocation();
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-app-bg font-sans text-app-text-dim selection:bg-app-accent selection:text-white transition-colors duration-500 flex">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-500",
        isCollapsed ? "ml-20" : "ml-20 lg:ml-64"
      )}>
        <Header />
        <main className="flex-1 p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full h-full max-w-6xl mx-auto"
            >
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/hoje" element={<Hoje />} />
                <Route path="/checklist" element={<Checklist />} />
                <Route path="/strategy" element={<Strategy />} />
                <Route path="/strategy/goal/:id" element={<GoalDetail />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/team" element={<Team />} />
                <Route path="/team/:id" element={<MemberDetail />} />
                <Route path="/agents" element={<Agents />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <GlobalAgentAssistant />
    </div>
  );
}

export default App;
