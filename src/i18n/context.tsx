import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Locale = 'en' | 'zh';
export type Theme = 'light' | 'dark' | 'system';

interface AppContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const AppContext = createContext<AppContextType>({
  locale: 'en', setLocale: () => {},
  theme: 'system', setTheme: () => {},
  isDark: false,
});

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('chord-analyzer-locale');
      if (saved === 'zh' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('chord-analyzer-theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {}
    return 'system';
  });

  const [systemDark, setSystemDark] = useState(getSystemDark);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  // Apply .dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('chord-analyzer-locale', l); } catch {}
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem('chord-analyzer-theme', t); } catch {}
  }, []);

  return (
    <AppContext.Provider value={{ locale, setLocale, theme, setTheme, isDark }}>
      {children}
    </AppContext.Provider>
  );
}

export function useLocale() {
  return useContext(AppContext);
}
