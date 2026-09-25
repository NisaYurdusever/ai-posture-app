import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Activity, Award, TrendingUp } from 'lucide-react';
import { loadLeaderboard } from '../services/storageService';
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

const CATEGORY_TO_FIELD = {
  calories: 'totalCalories',
  workouts: 'totalExercises',
  streak: 'streak'
};

export default function Leaderboard({ currentUsername }) {
  const { t } = useLanguage();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('calories'); // 'calories', 'workouts', 'streak'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await loadLeaderboard(CATEGORY_TO_FIELD[selectedCategory]);
      if (!cancelled) {
        setLeaderboardData(data);
        setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const getCategoryIcon = () => {
    switch (selectedCategory) {
      case 'calories': return <Flame className="w-5 h-5" />;
      case 'workouts': return <Activity className="w-5 h-5" />;
      case 'streak': return <Award className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-amber-500';
      case 2: return 'from-slate-300 to-slate-400';
      case 3: return 'from-orange-400 to-amber-600';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white font-outfit">{t('leaderboard.title')}</h2>
            <p className="text-slate-400">{t('leaderboard.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setSelectedCategory('calories')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            selectedCategory === 'calories'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
          }`}>
          <Flame className="w-5 h-5" />
          {t('leaderboard.totalCalories')}
        </button>

        <button
          onClick={() => setSelectedCategory('workouts')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            selectedCategory === 'workouts'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
          }`}>
          <Activity className="w-5 h-5" />
          {t('leaderboard.workoutCount')}
        </button>

        <button
          onClick={() => setSelectedCategory('streak')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            selectedCategory === 'streak'
              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
          }`}>
          <Award className="w-5 h-5" />
          {t('leaderboard.longestStreak')}
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">{t('leaderboard.loading')}</p>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">{t('leaderboard.noData')}</p>
            <p className="text-slate-500 text-sm mt-2">{t('leaderboard.beFirst')}</p>
          </div>
        ) : (
          leaderboardData.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.username === currentUsername;
            const isTopThree = rank <= 3;

            return (
              <div
                key={user.uid}
                className={`p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-cyan-950/80 to-violet-950/80 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                    : isTopThree
                    ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50'
                    : 'bg-slate-800/40 border border-slate-700/30'
                }`}>
                <div className="flex items-center justify-between">
                  {/* Rank & User Info */}
                  <div className="flex items-center gap-4">
                    {/* Medal/Rank */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getMedalColor(rank)} flex items-center justify-center font-black text-white text-xl shadow-lg`}>
                      {getMedalIcon(rank)}
                    </div>

                    {/* Username */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-xl font-bold ${isCurrentUser ? 'text-cyan-300' : 'text-white'}`}>
                          {user.username}
                        </p>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                            {t('leaderboard.you')}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">
                        {user.weeklyWorkouts || 0} {t('leaderboard.workoutsThisWeek')}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      {getCategoryIcon()}
                      <p className={`text-2xl font-black ${isCurrentUser ? 'text-cyan-300' : 'text-white'}`}>
                        {selectedCategory === 'calories' ? (user.totalCalories || 0) :
                         selectedCategory === 'workouts' ? (user.totalExercises || 0) :
                         (user.streak || 0)}
                      </p>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {selectedCategory === 'calories' ? t('leaderboard.kcal') :
                       selectedCategory === 'workouts' ? t('leaderboard.workoutsUnit') :
                       t('leaderboard.dayStreak')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Motivational Message */}
      {leaderboardData.length > 0 && currentUsername && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/50 to-fuchsia-950/50 border border-violet-700/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-violet-400" />
            <div>
              <p className="text-white font-bold">{t('leaderboard.climbTitle')}</p>
              <p className="text-slate-400 text-sm">
                {t('leaderboard.climbDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
