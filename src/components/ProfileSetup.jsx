import React, { useState } from 'react';// React ve useState hook'unu import ettik
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

export default function ProfileSetup({ onComplete }) {// ProfileSetup ile, kullanıcıdan profil bilgilerini toplamak için kullanılan bir form içerir.
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    height: '',
    weight: '',
    targetMuscles: [],
    cycleDay: '',
    fitnessLevel: ''
  });

  // NOT: Bu diziler VERİ DEĞERLERİ olarak İngilizce kalıyor (programGenerator.js,
  // exercises.json vb. bu tam string'lere göre eşleştirme yapıyor) - sadece
  // ekrandaki etiketler t('common.muscles.X') ile çevriliyor.
  const muscleOptions = ['Legs', 'Arms', 'Chest', 'Abs', 'Back', 'Shoulders', 'Hips', 'Full Body'];
  const fitnessLevels = ['beginner', 'intermediate', 'advanced'];

  const handleSubmit = (e) => {// Form submit edildiğinde çalışacak fonksiyon
    e.preventDefault();
    onComplete(formData);
  };

  const toggleMuscle = (muscle) => {// Hedef kas seçimini yönetir
    setFormData(prev => ({
      ...prev,
      targetMuscles: prev.targetMuscles.includes(muscle)// Seçili kas zaten varsa, listeden çıkarır; yoksa ekler
        ? prev.targetMuscles.filter(m => m !== muscle)// Seçili kas zaten varsa, listeden çıkarır
        : [...prev.targetMuscles, muscle]
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h2 className="text-5xl font-black mb-3 text-cyan-300 font-outfit">
          {t('profileSetup.title')}
        </h2>
        <p className="text-slate-400 mb-10">{t('profileSetup.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cinsiyet */}
          <div className="space-y-3">
            <label className="text-slate-300 font-semibold block">{t('profileSetup.genderLabel')}</label>
            <div className="grid grid-cols-2 gap-4">
              {['Female', 'Male'].map(gender => (// Cinsiyet seçeneklerini döngü ile oluşturur - değer İngilizce kalıyor, etiket çevriliyor
                <button
                  key={gender}
                  type="button"
                  onClick={() => setFormData({...formData, gender})}// Cinsiyet seçimini günceller
                  className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                    formData.gender === gender// Seçili cinsiyete göre buton stilini değiştirir
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg scale-105'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                  }`}>
                  {t(`common.gender.${gender}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Kadınlar için döngü günü */}
          {formData.gender === 'Female' && (
            <div className="space-y-3 p-4 bg-violet-950/30 rounded-xl border border-violet-800/30">
              <label className="text-violet-300 font-semibold block">{t('profileSetup.cycleDayLabel')}</label>
              <input
                type="number"
                min="1"
                max="28"
                value={formData.cycleDay}
                onChange={(e) => setFormData({...formData, cycleDay: e.target.value})}
                className="w-full p-4 rounded-xl bg-slate-900/80 text-white border border-violet-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                placeholder={t('profileSetup.cycleDayPlaceholder')}
              />
              <p className="text-xs text-violet-400/80">{t('profileSetup.cycleDayNote')}</p>
            </div>
          )}

          {/* Yaş & Boy & Kilo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-3">
              <label className="text-slate-300 font-semibold block">{t('profileSetup.ageLabel')}</label>
              <input
                type="number"
                min="10"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full p-4 rounded-xl bg-slate-800/60 text-white border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="25"
              />
            </div>
            <div className="space-y-3">
              <label className="text-slate-300 font-semibold block">{t('profileSetup.heightLabel')}</label>
              <input
                type="number"
                value={formData.height}// Boy bilgisini günceller
                onChange={(e) => setFormData({...formData, height: e.target.value})}// Boy bilgisini günceller
                className="w-full p-4 rounded-xl bg-slate-800/60 text-white border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="170"
              />
            </div>
            <div className="space-y-3">
              <label className="text-slate-300 font-semibold block">{t('profileSetup.weightLabel')}</label>
              <input
                type="number"
                value={formData.weight}// Kilo bilgisini günceller
                onChange={(e) => setFormData({...formData, weight: e.target.value})}// Kilo bilgisini günceller
                className="w-full p-4 rounded-xl bg-slate-800/60 text-white border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="65"
              />
            </div>
          </div>
          {/* NOT: Yaş alanı su tüketimi hedefi (WaterTracker) için eklendi -
              boy/kilo ile birlikte tek satırda 3 sütun oldu. */}

          {/* Fitness seviyesi */}
          <div className="space-y-3">
            <label className="text-slate-300 font-semibold block">{t('profileSetup.fitnessLabel')}</label>
            <p className="text-xs text-slate-500">{t('profileSetup.fitnessHint')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fitnessLevels.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({...formData, fitnessLevel: level})}
                  className={`p-4 rounded-xl font-semibold transition-all duration-300 text-left ${
                    formData.fitnessLevel === level
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg scale-105'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                  }`}>
                  <p>{t(`common.fitnessLevels.${level}.label`)}</p>
                  <p className={`text-xs font-normal ${formData.fitnessLevel === level ? 'text-white/70' : 'text-slate-500'}`}>{t(`common.fitnessLevels.${level}.hint`)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Hedef Kaslar */}
          <div className="space-y-3">
            <label className="text-slate-300 font-semibold block">{t('profileSetup.targetMusclesLabel')}</label>
            <div className="grid grid-cols-2 gap-3">
              {muscleOptions.map(muscle => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => toggleMuscle(muscle)}// Hedef kas seçimini yönetir 
                  className={`p-3 rounded-lg font-medium transition-all duration-300 ${
                    formData.targetMuscles.includes(muscle)// Seçili kaslara göre buton stilini değiştirir
                      ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500'
                      : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                  }`}>
                  {t(`common.muscles.${muscle}`)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"// Form gönder butonu, gerekli tüm bilgilerin girilmesini bekler
            disabled={!formData.gender || !formData.age || !formData.height || !formData.weight || !formData.fitnessLevel || formData.targetMuscles.length === 0}// Tüm bilgilerin girilmesini bekler
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/50">
            {t('profileSetup.continue')}
          </button>
        </form>
      </div>
    </div>
  );
}
