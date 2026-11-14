import React, { createContext, useContext, useState, useMemo } from 'react';
import { teluguTranslations } from './translations';

export type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (text: string) => text,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('dma_language');
      return saved === 'te' ? 'te' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('dma_language', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  const t = useMemo(() => {
    return (text: string): string => {
      if (language === 'en' || !text) return text;
      // Exact dictionary lookup
      if (teluguTranslations[text]) {
        return teluguTranslations[text];
      }
      // If starts with "Page X —"
      if (text.startsWith('Page ')) {
        const afterDash = text.split('—')[1]?.trim();
        if (afterDash && teluguTranslations[afterDash]) {
          const pageNum = text.split('—')[0].trim();
          return `${pageNum.replace('Page', 'పేజీ')} — ${teluguTranslations[afterDash]}`;
        }
      }
      return text;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};
