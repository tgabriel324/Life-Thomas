import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User, Database, Palette, Moon, Sun, Terminal, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore, ThemeType } from '../../store/useThemeStore';

export function Header() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const { theme, setTheme } = useThemeStore();
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
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
  }, [theme]);

  const themes: { id: ThemeType; name: string; icon: any; color: string }[] = [
    { id: 'obsidian', name: 'Obsidian', icon: Moon, color: 'bg-zinc-900' },
    { id: 'snow', name: 'Snow', icon: Sun, color: 'bg-white' },
    { id: 'cyber-emerald', name: 'Cyber', icon: Terminal, color: 'bg-emerald-950' },
    { id: 'royal-navy', name: 'Royal', icon: Compass, color: 'bg-slate-900' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-app-bg/40 backdrop-blur-xl border-b border-app-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-app-fg rounded-xl flex items-center justify-center text-app-bg font-display font-black text-xl transition-all group-hover:scale-105 group-hover:rotate-3 shadow-glow-accent">
              LT
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-app-fg">Life Thomas</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-2">
            <Link 
              to="/" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                isHome ? "bg-app-accent text-white" : "text-app-text-dim hover:text-app-fg hover:bg-app-card"
              )}
            >
              Dashboard
            </Link>
            <Link 
              to="/hoje" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname === '/hoje' ? "bg-app-accent text-white" : "text-app-text-dim hover:text-app-fg hover:bg-app-card"
              )}
            >
              Hoje
            </Link>
            <Link 
              to="/checklist" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname === '/checklist' ? "bg-app-accent text-white" : "text-app-text-dim hover:text-app-fg hover:bg-app-card"
              )}
            >
              Checklist
            </Link>
            <Link 
              to="/projects" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname.startsWith('/projects') ? "bg-app-accent text-white" : "text-app-text-dim hover:text-app-fg hover:bg-app-card"
              )}
            >
              Projetos
            </Link>
            <Link 
              to="/agents" 
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                location.pathname.startsWith('/agents') ? "bg-app-accent text-white" : "text-app-text-dim hover:text-app-fg hover:bg-app-card"
              )}
            >
              Agentes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Switcher */}
          <div className="relative">
            <button 
              onClick={() => setShowThemes(!showThemes)}
              className="p-2 text-app-text-dim hover:text-app-fg transition-colors"
            >
              <Palette size={20} />
            </button>
            {showThemes && (
              <div className="absolute top-full right-0 mt-2 p-2 bg-app-bg border border-app-border rounded-2xl shadow-elite min-w-[160px] z-[60]">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setShowThemes(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                      theme === t.id ? "bg-app-accent text-white" : "hover:bg-app-card text-app-text-dim hover:text-app-fg"
                    )}
                  >
                    <t.icon size={14} />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Database Status Indicator */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
            dbStatus === 'connected' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
            dbStatus === 'error' && "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
            dbStatus === 'loading' && "bg-app-card text-app-text-dim border-app-border"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              dbStatus === 'connected' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : 
              dbStatus === 'error' ? "bg-rose-400" : "bg-app-text-dim"
            )} />
            {dbStatus === 'connected' ? 'System Online' : dbStatus === 'error' ? 'System Offline' : 'Syncing...'}
          </div>

          <button className="p-2 text-app-text-dim hover:text-app-fg transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-app-text-dim hover:text-app-fg transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-app-accent rounded-full shadow-glow-accent"></span>
          </button>
          <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center text-app-text-dim overflow-hidden hover:border-app-accent transition-all cursor-pointer">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
