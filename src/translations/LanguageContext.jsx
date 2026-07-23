import { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { hi } from './hi';
import { hinglish } from './hinglish';
import { pa } from './pa';

const dictionaries = { en, hi, hinglish, pa };

export const languages = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish (Roman)' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('splitly_language') || 'en';
  });

  function setLanguage(langCode) {
    if (dictionaries[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('splitly_language', langCode);
    }
  }

  function t(key) {
    const dict = dictionaries[language] || dictionaries.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    return dictionaries.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
