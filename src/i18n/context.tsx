import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Locale = 'en' | 'zh';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({ locale: 'en', setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('chord-analyzer-locale');
      if (saved === 'zh' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('chord-analyzer-locale', l); } catch {}
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
