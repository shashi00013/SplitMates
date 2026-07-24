import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('splitly_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  const [activeTheme, setActiveTheme] = useState(() => {
    if (themeMode === 'system') return getSystemTheme();
    return themeMode;
  });

  const applyTheme = useCallback((mode) => {
    const effective = mode === 'system' ? getSystemTheme() : mode;
    setActiveTheme(effective);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effective);
    }
  }, []);

  const setThemeMode = useCallback((mode) => {
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') return;
    setThemeModeState(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('splitly_theme', mode);
    }
    applyTheme(mode);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(themeMode);

    if (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode, applyTheme]);

  return (
    <ThemeContext.Provider value={{ themeMode, activeTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
