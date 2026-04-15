import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  FolderKanban, 
  Users, 
  Palette, 
  Moon, 
  Sun, 
  Terminal, 
  Compass,
  Search,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Target,
  Users2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore, ThemeType } from '../../store/useThemeStore';

import { useSidebarStore } from '../../store/useSidebarStore';

export function Sidebar() {
  const location = useLocation();
  const { theme, setTheme } = useThemeStore();
  const { isCollapsed, toggle } = useSidebarStore();
  const [showThemes, setShowThemes] = useState(false);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hoje', label: 'Hoje', icon: Calendar },
    { to: '/checklist', label: 'Checklist', icon: CheckSquare },
    { to: '/strategy', label: 'Estratégia', icon: Target },
    { to: '/projects', label: 'Projetos', icon: FolderKanban },
    { to: '/team', label: 'Equipe', icon: Users2 },
    { to: '/agents', label: 'Agentes', icon: Users },
  ];

  const themes: { id: ThemeType; name: string; icon: any }[] = [
    { id: 'obsidian', name: 'Obsidian', icon: Moon },
    { id: 'snow', name: 'Snow', icon: Sun },
    { id: 'cyber-emerald', name: 'Cyber', icon: Terminal },
    { id: 'royal-navy', name: 'Royal', icon: Compass },
  ];

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-app-bg border-r border-app-border transition-all duration-500 z-50 flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-app-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-app-fg rounded-xl flex items-center justify-center text-app-bg font-display font-black text-xl shrink-0 shadow-glow-accent">
            LT
          </div>
          {!isCollapsed && (
            <span className="font-display font-bold text-xl tracking-tight text-app-fg truncate">
              Life Thomas
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navLinks.map((link) => {
          const isActive = link.to === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(link.to);
          
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-app-accent text-app-bg shadow-glow-accent" 
                  : "text-app-text-dim hover:text-app-fg hover:bg-app-card"
              )}
            >
              <link.icon size={20} className={cn("shrink-0", isActive ? "text-app-bg" : "group-hover:text-app-accent")} />
              {!isCollapsed && (
                <span className="text-sm font-bold tracking-tight">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-app-border space-y-2">
        {/* Theme Switcher */}
        <div className="relative">
          <button 
            onClick={() => setShowThemes(!showThemes)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-app-text-dim hover:text-app-fg hover:bg-app-card transition-all",
              isCollapsed && "justify-center"
            )}
          >
            <Palette size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm font-bold">Temas</span>}
          </button>
          
          {showThemes && (
            <div className={cn(
              "absolute bottom-full left-0 mb-2 p-2 bg-app-bg border border-app-border rounded-2xl shadow-elite min-w-[160px] z-[60]",
              isCollapsed && "left-full ml-2 bottom-0"
            )}>
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

        {/* Collapse Toggle */}
        <button 
          onClick={toggle}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-app-text-dim hover:text-app-fg hover:bg-app-card transition-all",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? <ChevronRight size={20} /> : (
            <>
              <ChevronLeft size={20} className="shrink-0" />
              <span className="text-sm font-bold">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
