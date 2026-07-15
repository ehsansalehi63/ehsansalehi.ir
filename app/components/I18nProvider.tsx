'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, dictionary, Translations } from '../lib/i18n';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'fa',
  setLang: () => {},
  toggleLang: () => {},
  t: dictionary.fa,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('fa');

  useEffect(() => {
    const saved = localStorage.getItem('site_lang') as Language | null;
    if (saved === 'en' || saved === 'fa') {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'fa' ? 'rtl' : 'ltr';
    } else {
      // Auto-detect based on browser
      const browserLang = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
      if (browserLang.startsWith('fa') || browserLang.includes('ir')) {
        setLangState('fa');
        document.documentElement.lang = 'fa';
        document.documentElement.dir = 'rtl';
      } else {
        setLangState('en');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('site_lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'fa' ? 'rtl' : 'ltr';
  };

  const toggleLang = () => {
    const nextLang = lang === 'fa' ? 'en' : 'fa';
    setLang(nextLang);
  };

  const t = dictionary[lang] || dictionary.fa;

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
