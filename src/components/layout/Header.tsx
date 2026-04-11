import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'loading'>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setDbStatus(data.database === 'connected' ? 'connected' : 'error');
      } catch (e) {
        setDbStatus('error');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-black/40 backdrop-blur-xl border-b border-zinc-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-display font-black text-xl transition-all group-hover:scale-105 group-hover:rotate-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              LT
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">Life Thomas</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-2">
            <Link 
              to="/" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                isHome ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              )}
            >
              Dashboard
            </Link>
            <Link 
              to="/hoje" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname === '/hoje' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              )}
            >
              Hoje
            </Link>
            <Link 
              to="/checklist" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname === '/checklist' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              )}
            >
              Checklist
            </Link>
            <Link 
              to="/projects" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname.startsWith('/projects') ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              )}
            >
              Projetos
            </Link>
            <Link 
              to="/agents" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname.startsWith('/agents') ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              )}
            >
              Agentes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Database Status Indicator */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
            dbStatus === 'connected' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
            dbStatus === 'error' && "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
            dbStatus === 'loading' && "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              dbStatus === 'connected' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : 
              dbStatus === 'error' ? "bg-rose-400" : "bg-zinc-600"
            )} />
            {dbStatus === 'connected' ? 'System Online' : dbStatus === 'error' ? 'System Offline' : 'Syncing...'}
          </div>

          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-zinc-500 hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]"></span>
          </button>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 overflow-hidden hover:border-zinc-600 transition-all cursor-pointer">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
