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

  function formatYouGet(amount) {
    if (language === 'hinglish') return `Tumhe ${amount} milne hain`;
    if (language === 'hi') return `आपको ${amount} मिलेंगे`;
    if (language === 'pa') return `ਤੁਹਾਨੂੰ ${amount} ਮਿਲਣਗੇ`;
    return `You get ${amount}`;
  }

  function formatYouPay(amount) {
    if (language === 'hinglish') return `Tumhe ${amount} dene hain`;
    if (language === 'hi') return `आपको ${amount} देने हैं`;
    if (language === 'pa') return `ਤੁਸੀਂ ${amount} ਦੇਣੇ ਹਨ`;
    return `You owe ${amount}`;
  }

  function formatMemberOwed(name, amount) {
    if (language === 'hinglish') return `${name} se ${amount} milne hain`;
    if (language === 'hi') return `${name} से ${amount} मिलेंगे`;
    if (language === 'pa') return `${name} ਤੋਂ ${amount} ਮਿਲਣਗੇ`;
    return `${name} owes you ${amount}`;
  }

  function formatMemberPay(name, amount) {
    if (language === 'hinglish') return `${name} ko ${amount} dene hain`;
    if (language === 'hi') return `${name} को ${amount} देने हैं`;
    if (language === 'pa') return `${name} ਨੂੰ ${amount} ਦੇਣੇ ਹਨ`;
    return `You owe ${name} ${amount}`;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages,
        formatYouGet,
        formatYouPay,
        formatMemberOwed,
        formatMemberPay,
      }}
    >
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
