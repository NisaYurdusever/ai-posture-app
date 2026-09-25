import React, { useState, useEffect } from 'react';
import { Droplet, Plus, MapPin, Info, X } from 'lucide-react';
import { loadWaterLog, addWaterIntake } from '../services/storageService';
import { calculateWaterTargetML } from '../utils/waterCalculator';
import { fetchCurrentTemperature, requestUserLocation } from '../services/weatherService';
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

/**
 * Günlük su tüketimi takip kartı. Hedef, kullanıcının kilo/yaş/boy/
 * cinsiyet + bugün yaptığı antrenman süresine göre hesaplanıyor
 * (waterCalculator.js). Hava durumu TAMAMEN OPSİYONEL - kullanıcı
 * "Adjust for weather" butonuna basıp konum izni vermedikçe hiç
 * devreye girmiyor, reddedilirse veya kapalı kalırsa özellik sorunsuz
 * çalışmaya devam eder.
 */
export default function WaterTracker({ userProfile, workoutHistory }) {
  const { t } = useLanguage();
  const [consumedML, setConsumedML] = useState(0);
  const [loading, setLoading] = useState(true);
  const [temperature, setTemperature] = useState(null);
  // weatherStatus: 'idle' | 'loading' | 'enabled' | 'denied' | 'error'
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    async function load() {
      const log = await loadWaterLog();
      setConsumedML(log.consumedML || 0);
      setLoading(false);
    }
    load();
  }, []);

  const handleEnableWeather = async () => {
    setWeatherStatus('loading');
    try {
      const { latitude, longitude } = await requestUserLocation();
      const temp = await fetchCurrentTemperature(latitude, longitude);
      if (temp == null) {
        setWeatherStatus('error');
        return;
      }
      setTemperature(temp);
      setWeatherStatus('enabled');
    } catch {
      // Kullanıcı izni reddetti ya da istek başarısız oldu - sessizce
      // devre dışı bırakıyoruz, hedef profil bilgilerine göre hesaplanmaya devam ediyor.
      setWeatherStatus('denied');
    }
  };

  const handleAdd = async (amountML) => {
    setConsumedML(prev => prev + amountML); // optimistic update
    await addWaterIntake(amountML);
  };

  // Yaş bilgisi olmayan (henüz Settings'ten girmemiş) eski hesaplar için
  // hedef hesaplanamıyor - kısa bir yönlendirme gösteriliyor.
  if (!loading && !userProfile.age) {
    return (
      <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <Droplet className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">{t('water.title')}</h3>
        </div>
        <p className="text-slate-400 text-sm">{t('water.needAge')}</p>
      </div>
    );
  }

  const targetML = calculateWaterTargetML({
    weight: userProfile.weight,
    height: userProfile.height,
    age: userProfile.age,
    gender: userProfile.gender,
    workoutHistory,
    temperature: weatherStatus === 'enabled' ? temperature : null
  });

  const progress = targetML > 0 ? Math.min(consumedML / targetML, 1) : 0;

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900/40 border border-cyan-800/30">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <Droplet className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{t('water.title')}</h3>
            <p className="text-slate-400 text-xs">
              {consumedML} / {targetML} ml {t('water.today')}
              {weatherStatus === 'enabled' && temperature != null && ` · ${Math.round(temperature)}°C`}
            </p>
          </div>
        </div>

        {weatherStatus !== 'enabled' && (
          <button
            onClick={handleEnableWeather}
            disabled={weatherStatus === 'loading'}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 disabled:opacity-50 transition-all">
            <MapPin className="w-3.5 h-3.5" />
            {weatherStatus === 'loading' ? t('water.gettingLocation') : t('water.adjustWeather')}
          </button>
        )}
      </div>

      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <button
          onClick={() => handleAdd(250)}
          className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-sm font-semibold flex items-center gap-1.5 transition-all">
          <Plus className="w-4 h-4" /> {t('water.add250')}
        </button>
        <button
          onClick={() => handleAdd(500)}
          className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 text-sm font-semibold flex items-center gap-1.5 transition-all">
          <Plus className="w-4 h-4" /> {t('water.add500')}
        </button>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="ml-auto p-2 rounded-full text-slate-500 hover:text-slate-300 transition-all"
          title={t('water.aboutEstimate')}>
          <Info className="w-4 h-4" />
        </button>
      </div>

      {weatherStatus === 'denied' && (
        <p className="text-slate-500 text-xs mb-2">{t('water.deniedLocation')}</p>
      )}
      {weatherStatus === 'error' && (
        <p className="text-slate-500 text-xs mb-2">{t('water.weatherError')}</p>
      )}

      {showInfo && (
        <div className="mt-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800 relative">
          <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-slate-400 text-xs pr-5 leading-relaxed">
            {t('water.infoText')}
          </p>
        </div>
      )}
    </div>
  );
}
