import React from 'react';
import { useLanguage } from '../context/LanguageContext';

// Küçük EN/TR toggle. App.jsx içinde her ekranda sabit konumda gösteriliyor,
// ayrıca Settings.jsx'te de aynı bileşen tekrar kullanılıyor.
export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex rounded-xl bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          language === 'en'
            ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}>
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('tr')}
        aria-pressed={language === 'tr'}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          language === 'tr'
            ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}>
        TR
      </button>
    </div>
  );
}
