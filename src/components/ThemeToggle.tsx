'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('tct_shield_theme') || localStorage.getItem('abuseshield_theme')) as Theme | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeState(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let resolved: 'light' | 'dark';
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }

      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem('tct_shield_theme', newTheme);
    } catch {}
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color Theme Selection"
      className={`flex items-center rounded-md border border-border bg-card/80 p-0.5 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Switch to light mode"
        aria-pressed={theme === 'light'}
        className={`h-7 px-2 rounded flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
          theme === 'light'
            ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Switch to dark mode"
        aria-pressed={theme === 'dark'}
        className={`h-7 px-2 rounded flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
          theme === 'dark'
            ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title="Sync with system preference"
        aria-pressed={theme === 'system'}
        className={`h-7 px-2 rounded flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
          theme === 'system'
            ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">System</span>
      </button>
    </div>
  );
};
