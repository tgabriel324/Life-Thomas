import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'obsidian' | 'snow' | 'cyber-emerald' | 'royal-navy';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'obsidian',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
