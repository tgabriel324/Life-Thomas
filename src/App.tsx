import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Checklist } from './pages/Checklist';
import { Hoje } from './pages/Hoje';
import { Agents } from './pages/Agents';
import { GlobalAgentAssistant } from './components/agents/GlobalAgentAssistant';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Header />
      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/hoje" element={<Hoje />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/agents" element={<Agents />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <GlobalAgentAssistant />
    </div>
  );
}

export default App;
