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
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xl transition-transform group-hover:scale-105">
              LT
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900">Life Thomas</span>
          </Link>
          
          <nav className="hidden md:flex items-center ml-8 gap-1">
            {/* ... existing links ... */}
            <Link 
              to="/" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isHome ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Dashboard
            </Link>
            <Link 
              to="/hoje" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname === '/hoje' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Hoje
            </Link>
            <Link 
              to="/checklist" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname === '/checklist' ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Checklist
            </Link>
            <Link 
              to="/projects" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname.startsWith('/projects') ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Projetos
            </Link>
            <Link 
              to="/agents" 
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                location.pathname.startsWith('/agents') ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              Agentes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Database Status Indicator */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            dbStatus === 'connected' && "bg-emerald-50 text-emerald-600 border-emerald-100",
            dbStatus === 'error' && "bg-rose-50 text-rose-600 border-rose-100 animate-pulse",
            dbStatus === 'loading' && "bg-zinc-50 text-zinc-400 border-zinc-100"
          )}>
            <Database size={12} />
            {dbStatus === 'connected' ? 'DB Online' : dbStatus === 'error' ? 'DB Offline' : 'Checking DB...'}
          </div>

          <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 overflow-hidden">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
