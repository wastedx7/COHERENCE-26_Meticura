import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, languages } from '../i18n';
import type { Language } from '../i18n';

interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): string {
  try {
    const stored = localStorage.getItem('meticura_lang');
    if (stored && translations[stored]) return stored;
  } catch { /* SSR or blocked localStorage */ }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState(getInitialLanguage);

  const setLanguage = useCallback((code: string) => {
    if (translations[code]) {
      setLang(code);
      try { localStorage.setItem('meticura_lang', code); } catch { /* ignore */ }
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] ?? translations['en']?.[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
