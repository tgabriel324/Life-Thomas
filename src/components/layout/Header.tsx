import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Database, Palette, Moon, Sun, Terminal, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore, ThemeType } from '../../store/useThemeStore';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [dbStatus, setDbStatus] = useState<'connected' | 'mocked' | 'error' | 'loading'>('loading');
  const { theme, setTheme } = useThemeStore();
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.database === 'connected') setDbStatus('connected');
        else if (data.database === 'mocked') setDbStatus('mocked');
        else setDbStatus('error');
      } catch (e) {
        setDbStatus('error');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [theme]);

  const themes: { id: ThemeType; name: string; icon: any; color: string }[] = [
    { id: 'obsidian', name: 'Obsidian', icon: Moon, color: 'bg-zinc-900' },
    { id: 'snow', name: 'Snow', icon: Sun, color: 'bg-white' },
    { id: 'cyber-emerald', name: 'Cyber', icon: Terminal, color: 'bg-emerald-950' },
    { id: 'royal-navy', name: 'Royal', icon: Compass, color: 'bg-slate-900' },
  ];

  return (
    <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-app-border bg-app-bg/40 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-app-fg/40">
          {location.pathname === '/' ? 'Dashboard' : 
           location.pathname === '/hoje' ? 'Foco Operacional' :
           location.pathname === '/checklist' ? 'Checklist' :
           location.pathname.startsWith('/projects') ? 'Projetos' :
           location.pathname.startsWith('/agents') ? 'Agentes' : 'Sistema'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Database Status Indicator */}
        <div className={cn(
          "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-500",
          dbStatus === 'connected' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          dbStatus === 'mocked' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
          dbStatus === 'error' && "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
          dbStatus === 'loading' && "bg-app-card text-app-fg border-app-border"
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            dbStatus === 'connected' ? "bg-emerald-400" : 
            dbStatus === 'mocked' ? "bg-amber-400" :
            dbStatus === 'error' ? "bg-rose-400" : "bg-app-text-dim"
          )} />
          {dbStatus === 'connected' ? 'Online' : dbStatus === 'mocked' ? 'Mock Mode' : dbStatus === 'error' ? 'Offline' : 'Syncing...'}
        </div>

        <button className="p-2 text-app-fg/70 hover:text-app-fg transition-colors">
          <Search size={20} />
        </button>
        <button className="p-2 text-app-fg/70 hover:text-app-fg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-app-accent rounded-full"></span>
        </button>
        <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center text-app-fg/70 overflow-hidden hover:border-app-accent transition-all cursor-pointer">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
