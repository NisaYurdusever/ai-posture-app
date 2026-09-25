import React from 'react';
import { CheckCircle, Flame, Timer, Hash, TrendingUp, X } from 'lucide-react';
import { getCalorieLevel } from '../utils/calorieCalculator';//Kalori seviyesini belirlemek için kullanılan yardımcı fonksiyonu import ettik
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

export default function WorkoutCompleteModal({ 
  exercise, 
  duration, 
  reps, 
  calories,
  onSave, 
  onDiscard 
}) {
  const { t } = useLanguage();
  const calorieInfo = getCalorieLevel(calories);// Kalori miktarına göre geri bildirim bilgilerini alır

  const formatTime = (seconds) => {// Süreyi dakika:saniye formatına çevirir
    const mins = Math.floor(seconds / 60);// Dakikayı hesaplar
    const secs = seconds % 60;// Saniyeyi hesaplar
    return `${mins}:${secs.toString().padStart(2, '0')}`;// Dakika ve saniyeyi "mm:ss" formatında döndürür
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="max-w-md w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border-2 border-green-500/50 shadow-2xl shadow-green-500/20 animate-scaleIn">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl"></div>
            <CheckCircle className="w-20 h-20 text-green-400 relative animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-center text-white mb-2 font-outfit">
          {t('workoutComplete.congrats')}
        </h2>
        <p className="text-center text-slate-400 mb-6">
          {t('workoutComplete.completed', { exercise: exercise.name })}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Duration / Reps */}
          {exercise.type === 'timed' ? (
            <div className="p-4 rounded-2xl bg-cyan-950/50 border border-cyan-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-cyan-400" />
                <p className="text-cyan-300 text-sm font-semibold">{t('workoutComplete.duration')}</p>
              </div>
              <p className="text-3xl font-black text-white">{formatTime(duration)}</p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-violet-950/50 border border-violet-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-5 h-5 text-violet-400" />
                <p className="text-violet-300 text-sm font-semibold">{t('workoutComplete.reps')}</p>
              </div>
              <p className="text-3xl font-black text-white">{reps}</p>
            </div>
          )}

          {/* Calories */}
          <div className={`p-4 rounded-2xl bg-${calorieInfo.color}-950/50 border border-${calorieInfo.color}-800/30`}>
            <div className="flex items-center gap-2 mb-2">
              <Flame className={`w-5 h-5 text-${calorieInfo.color}-400`} />
              <p className={`text-${calorieInfo.color}-300 text-sm font-semibold`}>{t('workoutComplete.calories')}</p>
            </div>
            <p className="text-3xl font-black text-white">{calories}</p>
          </div>
        </div>

        {/* Calorie Level */}
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-${calorieInfo.color}-950/50 to-${calorieInfo.color}-900/30 border border-${calorieInfo.color}-700/30 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-${calorieInfo.color}-300 font-bold text-lg`}>
                {calorieInfo.level}
              </p>
              <p className="text-slate-400 text-sm">{calorieInfo.message}</p>
            </div>
            <span className="text-4xl">{calorieInfo.emoji}</span>
          </div>
        </div>

        {/* Personal Best */}
        {(exercise.type === 'timed' && duration > 40) || (exercise.type === 'reps' && reps > 15) ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 to-orange-900/30 border border-amber-700/30 mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-amber-300 font-bold">{t('workoutComplete.personalBest')}</p>
                <p className="text-slate-400 text-xs">{t('workoutComplete.bestPerformance')}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 py-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold transition-all flex items-center justify-center gap-2">
            <X className="w-5 h-5" />
            {t('workoutComplete.discard')}
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all hover:scale-105 shadow-lg shadow-green-500/30">
            💾 {t('workoutComplete.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
