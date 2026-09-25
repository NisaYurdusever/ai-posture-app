import React from 'react';
//react kütüphanesini import ediyorum
import { Activity, Camera, User, TrendingUp } from 'lucide-react';
//lucide-react kütüphanesinden ikonları import ettim
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

export default function WelcomeScreen({ onStart }) {
    //WelcomeScreen bileşeni, uygulamanın açılış hoşgeldin ekranını temsil eder. Kullanıcıya uygulamanın amacını ve özelliklerini tanıtan görsel olarak bir arayüz sunar. "Start" butonuna tıklandığında onStart fonksiyonu çağrılır, bu da kullanıcıyı diğer sayfaya yönlendirir.
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
    {/* tüm ekranı kaplayan bir div oluşturuyorum, flexbox ile içeriği ortalıyorum, padding ekliyorum ve relative konumlandırma yapıyorum overflow-hidden taşan animasyonları gizlemek için kullandım */}

      {/* Animated background elements kısmı */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

{/* Content kısmı */}
      <div className="max-w-4xl text-center relative z-10">
        {/* z-10 ile içeriğin arka plan elementlerinin üstünde görünmesini sağladım */}

        {/* Logo kısmı */}
        <div className="mb-8 inline-block">
          <Activity className="w-24 h-24 text-cyan-400 animate-bounce" style={{animationDuration: '2s'}} />
          {/* Activity ikonunu büyük boyutta ve cyan renginde yaparak, bounce animasyonu ekledim. Animasyon süresini 2 saniye olarak ayarladım. */}
        </div>
        
        {/* Title ve açıklama kısmı */}
        <h1 className="text-7xl font-black mb-6 bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 text-transparent bg-clip-text tracking-tight font-outfit">
          {t('welcome.title')}
        </h1>
        
        <p className="text-2xl text-slate-300 mb-4 font-light tracking-wide font-inter">
          {t('welcome.tagline')}
        </p>
        
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('welcome.description')}
        </p>

        <button 
          onClick={onStart}
          className="group relative px-12 py-5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-2xl text-white text-xl font-bold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-violet-500/50">
          <span className="relative z-10">{t('welcome.start')}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

{/* Feature kartları kısmı */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {/* 3 sütunluk grid oluşturdum 3 özellik için. */}
          <FeatureCard icon={<Camera className="w-8 h-8" />} title={t('welcome.features.realtime')} />
          <FeatureCard icon={<User className="w-8 h-8" />} title={t('welcome.features.personalized')} />
          <FeatureCard icon={<TrendingUp className="w-8 h-8" />} title={t('welcome.features.progress')} />
        </div>
      </div>
    </div>
  );
}
{/* bileşeni ikon ve metni alır hover efektini uygular.*/}
function FeatureCard({ icon, title }) {
  return (
    <div className="p-6 rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:-translate-y-1">
      <div className="text-cyan-400 mb-3 flex justify-center">{icon}</div>
       {/* ikon kısmı */}
      <p className="text-slate-300 text-sm font-medium">{title}</p>
       {/* title kısmı */}
    </div>
  );
}
