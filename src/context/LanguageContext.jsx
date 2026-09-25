import React, { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

// YENİ: Türkçe dil desteği. Uygulama şimdiye kadar sabit İngilizce'ydi,
// artık kullanıcı EN/TR arasında geçiş yapabiliyor. Seçim tarayıcıda
// (localStorage) saklanıyor - cihazlar arası senkron istenirse ileride
// storageService.js üzerinden Firestore'a da yazılabilir (userProfile'a
// benzer şekilde), ama o dosya bu oturumda elimizde olmadığı için şimdilik
// sadece tarayıcı bazlı.
const STORAGE_KEY = 'appLanguage';

const LanguageContext = createContext(null);

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'tr') return saved;
  } catch {
    // localStorage kullanılamıyorsa (gizli sekme vb.) sessizce varsayılana düş
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // saklanamazsa sorun değil, sadece bu oturum için geçerli olur
    }
  };

  // t('settings.saveChanges') gibi nokta ile ayrılmış anahtarları okur.
  // Türkçe'de eksik bir anahtar varsa İngilizce'ye, o da yoksa anahtarın
  // kendisine düşer (ekranda çeviri anahtarı görünmesin diye son çare).
  const t = (key, vars) => {
    let str = getNested(translations[language], key);
    if (str === undefined) {
      str = getNested(translations.en, key);
    }
    if (str === undefined) {
      return key;
    }
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(`{${k}}`, vars[k]);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
