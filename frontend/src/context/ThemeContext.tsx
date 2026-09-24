import React, { createContext, useState, useEffect, useContext } from 'react';

export type Theme = 'dark' | 'light' | 'edge';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('SheherSaathi_theme') as Theme;
      if (saved === 'light' || saved === 'dark' || saved === 'edge') return saved;
      return 'light'; // Default to clean modern Light mode
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'theme-edge');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'edge') {
      root.classList.add('dark', 'theme-edge');
    } else {
      root.classList.add('light');
    }
    try {
      localStorage.setItem('SheherSaathi_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'edge';
      return 'light';
    });
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
