import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import './styles/tailwind.css';

// Not: React.StrictMode kasıtlı olarak kaldırıldı. StrictMode geliştirme
// modunda effect'leri iki kere çalıştırıyor (mount -> unmount -> mount),
// bu da MediaPipe Pose'un WASM modülünü bozup "Module.arguments" hatasına
// yol açıyordu. Kamera/WASM kullanan kütüphanelerle StrictMode'un bilinen
// bir çakışması.
//
// YENİ: Türkçe dil desteği için LanguageProvider en dışta sarmalıyor,
// böylece App.jsx ve altındaki tüm bileşenler useLanguage() hook'unu
// kullanabiliyor.
ReactDOM.createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
