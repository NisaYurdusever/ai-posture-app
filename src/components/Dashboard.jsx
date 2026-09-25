import React, { useState, useEffect } from 'react';// React ve useState, useEffect hook'larını import ettik
import { Activity, Play, Calendar, TrendingUp, Zap, Award, User, LogOut, Settings as SettingsIcon, Sparkles, ChevronDown, CheckCircle2, Circle, Flame } from 'lucide-react';// Lucide iconlarını import ettik
import { getPhaseInfo } from '../utils/cycleCalculator';// Kadın döngüsü bilgilerini hesaplamak için kullanılan yardımcı fonksiyonu import ettik
import { loadStats, logoutUser, loadWorkoutHistory, loadProgramProgress, toggleProgramDay } from '../services/storageService';//kullanıcı verilerrini yönetmek için servis import ettik
import { generateWeeklyProgram, getProgramSummary, getEstimatedDayCalories } from '../services/programGenerator';// Haftalık program oluşturmak ve özetlemek için kullanılan servisleri import ettik
import exercisesData from '../data/exercises.json';// Egzersiz verilerini içeren JSON dosyasını import ettik
import ProgressChart from './ProgressChart';// Kullanıcının gelişimini görselleştirmek için kullanılan ProgressChart bileşenini import ettik
import Leaderboard from './Leaderboard';// Kullanıcıların sıralandığı bir liderlik tablosu bileşenini import ettik
import AIChatbot from './AIChatbot';// Kullanıcıların sorularını yanıtlamak ve önerilerde bulunmak için kullanılan AIChatbot bileşenini import ettik
import Settings from './Settings';// Kullanıcıların profil bilgilerini güncelleyebileceği bir ayarlar sayfası bileşenini import ettik
import WaterTracker from './WaterTracker';// Kiloya/yaşa/boya (+opsiyonel hava durumuna) göre günlük su tüketimi takip kartı
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

// NOT: exercise.name (exercises.json'dan gelen egzersiz adları - "Squat",
// "Push-up" vb.) bu oturumda çevrilmedi, İngilizce kalıyor. Çevirmek
// istenirse exercises.json'a ayrı bir "name" alanı (ör. nameKey) eklenip
// translations.js'te karşılıkları tanımlanabilir - ayrı bir iş olarak
// bırakıldı çünkü programGenerator.js ve diğer dosyalar da bu adı kullanıyor.
export default function Dashboard({ userProfile, onSelectExercise, onLogout }) {//kullanıcı profilini, egzersiz seçimini ve çıkış işlemini yöneten Dashboard bileşeni
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    weeklyWorkouts: 0,
    totalExercises: 0,
    streak: 0
  });
  const [showAccountMenu, setShowAccountMenu] = useState(false);// Hesap menüsünün görünürlüğünü yönetir
  const [weeklyProgram, setWeeklyProgram] = useState(null);// Haftalık antrenman programını saklar
  const [showProgramDetails, setShowProgramDetails] = useState(false);// Haftalık program detaylarının görünürlüğünü yönetir
  const [workoutHistory, setWorkoutHistory] = useState([]);// Kullanıcının geçmiş antrenman verilerini saklar
  const [activeTab, setActiveTab] = useState('home');// Aktif sekmeyi yönetir (home veya leaderboard)
  const [showSettings, setShowSettings] = useState(false);// Ayarlar sayfasının görünürlüğünü yönetir
  // YENİ: Weekly Program'daki günlerin "tamamlandı" işaretlerini tutar
  // ({ weekId, completedDays: [] }) - storageService bunu hafta değişince
  // otomatik sıfırlıyor.
  const [programProgress, setProgramProgress] = useState({ weekId: '', completedDays: [] });
  const currentUsername = userProfile.username;

  useEffect(() => {// Bileşen yüklendiğinde kullanıcı istatistiklerini, haftalık programı ve antrenman geçmişini yükler
    async function loadDashboardData() {
      const loadedStats = await loadStats();
      setStats(loadedStats);

      const history = await loadWorkoutHistory();
      setWorkoutHistory(history);

      const progress = await loadProgramProgress();
      setProgramProgress(progress);
    }
    loadDashboardData();

    const program = generateWeeklyProgram(userProfile);
    setWeeklyProgram(program);
  }, [userProfile]);

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) onLogout();
  };

  // Bir günü tamamlandı/tamamlanmadı olarak işaretler - optimistic update
  // (ekran anında güncellenir), Firestore'a yazma arka planda tamamlanır.
  const handleToggleDay = async (dayName) => {
    setProgramProgress(prev => {
      const isDone = prev.completedDays.includes(dayName);
      const completedDays = isDone
        ? prev.completedDays.filter(d => d !== dayName)
        : [...prev.completedDays, dayName];
      return { ...prev, completedDays };
    });
    await toggleProgramDay(dayName);
  };

  const phaseInfo = userProfile.gender === 'Female' && userProfile.cycleDay // Kadın kullanıcılar için döngü bilgilerini hesaplar, erkek kullanıcılar için null döner
    ? getPhaseInfo(userProfile.cycleDay)
    : null;

  const getGreeting = () => {// Kullanıcıya günün saatine göre selam verir
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  if (showSettings) {// Ayarlar sayfası görünürse, Settings bileşenini render eder
    return (
      <Settings
        userProfile={userProfile}
        onBack={() => setShowSettings(false)}
        onProfileUpdate={() => {
          setShowSettings(false);
          window.location.reload();
        }}
        onAccountDeleted={() => {
          setShowSettings(false);
          if (onLogout) onLogout();
        }}
      />
    );
  }

  // Weekly Program'ın gün listesi (kadın: cycle.recommendations, erkek: weekly.weeklySchedule)
  const programDays = weeklyProgram
    ? (weeklyProgram.cycle?.recommendations || weeklyProgram.weekly?.weeklySchedule || [])
    : [];
  // Sadece gerçekten egzersiz içeren günler "tamamlanabilir" sayılıyor (tam
  // dinlenme günleri hariç) - ilerleme rozeti bunlara göre hesaplanıyor.
  const trainingDays = programDays.filter(d => d.exercises && d.exercises.length > 0);
  const completedCount = trainingDays.filter(d => programProgress.completedDays.includes(d.day)).length;

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-cyan-300 font-outfit">
                  {getGreeting()}, {currentUsername}! 👋
                </h1>
                <p className="text-slate-400 text-lg">{t('dashboard.readyForWorkout')}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition-all border border-slate-700/50 hover:border-cyan-500/50">
                  <User className="w-6 h-6 text-slate-300" />
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 shadow-2xl z-50">
                    <div className="p-3 border-b border-slate-700/50 mb-2">
                      <p className="text-white font-semibold">@{currentUsername}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {t(`common.gender.${userProfile.gender}`)} • {userProfile.height}cm • {userProfile.weight}kg
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowSettings(true);
                      }}
                      className="w-full p-3 rounded-xl hover:bg-slate-700/50 transition-all flex items-center gap-3 text-left">
                      <SettingsIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">{t('dashboard.settings')}</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full p-3 rounded-xl bg-red-950/50 transition-all flex items-center gap-3 text-left mt-1">
                      <LogOut className="w-5 h-5 text-red-400" />
                      <span className="text-red-300">{t('dashboard.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Menu */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'home'
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
              }`}>
            {t('dashboard.tabHome')}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
              }`}>
            {t('dashboard.tabLeaderboard')}
          </button>
        </div>

        {activeTab === 'home' ? (
          <>
            {phaseInfo && (
              <div className="mb-8">
                <div className={`relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-${phaseInfo.color}-950/60 to-${phaseInfo.color}-900/40 border-2 border-${phaseInfo.color}-700/40 backdrop-blur-sm`}>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-8 h-8 text-${phaseInfo.color}-400`} />
                        <div>
                          
                          <p className="text-2xl font-bold text-white mb-1">
                            {phaseInfo.phase}
                          </p>
                          <p className="text-slate-400 text-sm">{t('dashboard.day')} {userProfile.cycleDay}/28</p>
                        </div>
                      </div>

                      
                      <div className={`px-4 py-2 rounded-full bg-${phaseInfo.color}-500/10 border border-${phaseInfo.color}-500/30`}>
                        <p className="text-white font-semibold">
                          {t('dashboard.intensity')} <span className={`text-${phaseInfo.color}-400`}>{phaseInfo.intensity}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-white mb-4 leading-relaxed">{phaseInfo.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {phaseInfo.tips.map((tip, index) => (
                        <div key={index} className={`px-3 py-1.5 rounded-lg bg-${phaseInfo.color}-950/50 border border-${phaseInfo.color}-800/30`}>
                          <p className="text-xs text-white">💡 {tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {weeklyProgram && (
              <div className="mb-8">
                <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-purple-900/40 border-2 border-indigo-700/40 backdrop-blur-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                          <Sparkles className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-indigo-200">{t('dashboard.weeklyProgramTitle')}</h3>
                          <p className="text-slate-400 text-sm">
                            {getProgramSummary(weeklyProgram, userProfile)?.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {trainingDays.length > 0 && (
                          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold whitespace-nowrap">
                            {completedCount}/{trainingDays.length} {t('dashboard.doneThisWeek')}
                          </span>
                        )}
                        <button
                          onClick={() => setShowProgramDetails(!showProgramDetails)}
                          className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 transition-all border border-indigo-500/30 flex items-center gap-2">
                          <span className="text-indigo-300 font-semibold text-sm">
                            {showProgramDetails ? t('dashboard.hide') : t('dashboard.details')}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-indigo-300 transition-transform ${showProgramDetails ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {showProgramDetails && (
                      <div className="mt-6 space-y-4">
                        {/* ESKİ (basit) versiyon - sadece gün adı + focus etiketi + tek
                            satır not gösteriyordu. Daha detaylı/kişiselleştirilmiş
                            içerik (egzersiz listesi + tahmini kalori) ve tamamlama
                            takibi eklendiği için yorum satırına alındı - istenirse
                            aşağıdaki bloğu geri açıp yeni bloğu silmek yeterli:

                        {programDays.map((day, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-indigo-800/30">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-bold text-white">{day.day}</h4>
                              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {day.focus}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm italic">{day.notes}</p>
                          </div>
                        ))}
                        */}
                        {programDays.map((day, idx) => {
                          const isDone = programProgress.completedDays.includes(day.day);
                          const hasExercises = day.exercises && day.exercises.length > 0;
                          const dayCalories = hasExercises ? getEstimatedDayCalories(day, userProfile.weight) : 0;

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border transition-all ${
                                isDone
                                  ? 'bg-emerald-950/30 border-emerald-700/40'
                                  : 'bg-slate-900/50 border-indigo-800/30'
                              }`}>
                              <div className="flex items-center justify-between mb-2 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h4 className="text-lg font-bold text-white whitespace-nowrap">{day.day}</h4>
                                  {day.timeOfDay && (
                                    <span className="text-xs text-slate-500 truncate">{day.timeOfDay}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                                    {day.focus}
                                  </span>
                                  {hasExercises && (
                                    <button
                                      onClick={() => handleToggleDay(day.day)}
                                      title={isDone ? t('dashboard.markNotDone') : t('dashboard.markDone')}
                                      className={`p-1 rounded-full transition-all ${isDone ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                                      {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <p className="text-slate-400 text-sm italic mb-3">{day.notes}</p>

                              {hasExercises && (
                                <div className="space-y-1.5 mb-3">
                                  {day.exercises.map((ex, exIdx) => (
                                    <div key={exIdx} className="flex items-center justify-between text-sm bg-slate-950/40 rounded-lg px-3 py-2">
                                      <span className="text-slate-300">{ex.name || ex.id}</span>
                                      <span className="text-indigo-300 text-xs font-semibold whitespace-nowrap">
                                        {ex.sets ? `${ex.sets} x ` : ''}{ex.reps || (ex.duration ? `${ex.duration}s` : '')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {hasExercises && dayCalories > 0 && (
                                <p className="text-xs text-orange-300/80 flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5" />
                                  ~{dayCalories} {t('leaderboard.kcal')} {t('dashboard.estimatedKcal')}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                title={t('dashboard.statThisWeek')}
                value={stats.weeklyWorkouts}
                subtitle={t('dashboard.statWorkouts')}
                color="cyan"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title={t('dashboard.statTotal')}
                value={stats.totalExercises}
                subtitle={t('dashboard.statExercises')}
                color="violet"
              />
              <StatCard
                icon={<Award className="w-6 h-6" />}
                title={t('dashboard.statStreak')}
                value={stats.streak}
                subtitle={t('dashboard.statStreakUnit')}
                color="fuchsia"
                highlight
              />
            </div>

            <div className="mb-8">
              <WaterTracker userProfile={userProfile} workoutHistory={workoutHistory} />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-200 mb-6 font-outfit">{t('dashboard.todaysExercises')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercisesData.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onSelect={() => onSelectExercise(exercise)}
                    userProfile={userProfile}
                  />
                ))}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50">
              <h3 className="text-2xl font-bold text-slate-200 mb-6 font-outfit">{t('dashboard.progressChartTitle')}</h3>
              {workoutHistory.length > 0 ? (
                <ProgressChart workoutHistory={workoutHistory} />
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500">{t('dashboard.noWorkoutData')}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Leaderboard currentUsername={currentUsername} />
        )}
      </div>
      <AIChatbot userProfile={userProfile} />
    </div>
  );
}

function ExerciseCard({ exercise, onSelect, userProfile }) {
  const { t } = useLanguage();
  const isRecommended = userProfile.targetMuscles.includes('Full Body') || userProfile.targetMuscles.some(muscle =>
    exercise.targetMuscles.includes(muscle)
  );

  return (
    <button
      onClick={onSelect}
      className="group relative p-6 rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20 text-left overflow-hidden w-full">

      {isRecommended && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {t('dashboard.recommended')}
        </div>
      )}

      <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
        {exercise.icon}
      </div>

      {/* NOT: exercise.name (egzersiz adı) henüz çevrilmedi, bkz. dosya başındaki not */}
      <h3 className="text-2xl font-bold text-white mb-3 font-outfit">{exercise.name}</h3>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
          {exercise.type === 'timed' ? t('dashboard.timed') : t('dashboard.reps')}
        </span>
        <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
          {exercise.difficulty}
        </span>
      </div>

      <p className="text-slate-400 mb-4">
        {exercise.type === 'timed' // Egzersiz türüne göre süre veya tekrar aralığını gösterir
          ? `${exercise.duration.beginner}-${exercise.duration.advanced} ${t('dashboard.seconds')}`
          : `${exercise.reps.beginner}-${exercise.reps.advanced} ${t('dashboard.repsUnit')}`
        }
      </p>

      <div className="flex items-center text-cyan-400 font-semibold group-hover:gap-3 gap-2 transition-all">
        <span>{t('dashboard.begin')}</span>
        <Play className="w-5 h-5 fill-cyan-400" />
      </div>
    </button>
  );
}

function StatCard({ icon, title, value, subtitle, color, highlight }) {// İstatistik kartlarını render eden bileşen, highlight prop'u ile öne çıkan kartları belirler
  return (
    <div className={`relative overflow-hidden p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${highlight
        ? `bg-gradient-to-br from-${color}-600 to-${color}-700 border-2 border-${color}-500 text-white`
        : `bg-gradient-to-br from-${color}-950/50 to-slate-900/50 border border-${color}-800/30`
      }`}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${highlight ? 'bg-white/20' : `bg-${color}-500/20`}`}>
            <div className={highlight ? 'text-white' : `text-${color}-400`}>
              {icon}
            </div>
          </div>
        </div>
        <p className={`text-sm mb-2 ${highlight ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
        <p className={`text-4xl font-black mb-1 ${highlight ? 'text-white' : `text-${color}-300`}`}>{value}</p>
        <p className={`text-sm ${highlight ? 'text-white/60' : 'text-slate-500'}`}>{subtitle}</p>
      </div>
    </div>
  );
}
