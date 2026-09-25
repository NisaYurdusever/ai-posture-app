/**
 * Kalori Hesaplama Servisi
 * MET (Metabolic Equivalent of Task) değerleri kullanılarak kalori hesaplanır
 */

/**
 * MET değerleri (her egzersiz için)
 */
const MET_VALUES = {
  'plank': 3.8, // Core stability exercises
  'squat': 5.0, // Resistance training, squats
  'bicep-curl': 3.5, // Weight lifting, light to moderate
  'push-up': 8.0, // Calisthenics, vigorous
  'lunge': 4.0, // Resistance training, moderate
  'shoulder-press': 4.0, // Weight lifting, light to moderate
  'sit-up': 3.8, // Abdominal exercises, moderate
  'glute-bridge': 3.0, // Light resistance/bodyweight
  'jumping-jack': 8.0, // Vigorous cardio
  'running': 8.0,
  'walking': 3.5,
  'yoga': 2.5,
  'hiit': 8.0
};

/**
 * Kalori hesapla
 * Formül: Kalori = MET × Kilo (kg) × Süre (saat)
 * 
 * @param {string} exerciseId - Egzersiz ID'si
 * @param {number} weight - Kullanıcı kilosu (kg)
 * @param {number} duration - Süre (saniye)
 * @param {number} reps - Tekrar sayısı (opsiyonel)
 * @returns {number} yakılan kalori
 */
export function calculateCalories(exerciseId, weight, duration, reps = 0) {
  const met = MET_VALUES[exerciseId] || 4.0; // Default MET
  const hours = duration / 3600; // Saniyeyi saate çevir
  
  let calories = met * weight * hours;
  
  // Tekrar bazlı egzersizler için ek hesaplama
  if (reps > 0) {
    // Her tekrar yaklaşık 0.1-0.2 kalori yakar (egzersize göre değişir)
    const caloriesPerRep = met * 0.05; // MET'e göre ayarlanmış
    calories += reps * caloriesPerRep;
  }
  
  return Math.round(calories);
}

/**
 * Egzersize göre tahmini süre (tekrar bazlı egzersizler için)
 * @param {string} exerciseId 
 * @param {number} reps 
 * @returns {number} tahmini süre (saniye)
 */
export function estimateDuration(exerciseId, reps) {
  const secondsPerRep = {
    'squat': 3, // 3 saniye/tekrar
    'bicep-curl': 2.5, // 2.5 saniye/tekrar
    'push-up': 2.5,
    'lunge': 3,
    'shoulder-press': 2.5,
    'sit-up': 2,
    'glute-bridge': 2,
    'jumping-jack': 1.5
  };
  
  const timePerRep = secondsPerRep[exerciseId] || 3;
  return reps * timePerRep;
}

/**
 * Toplam kalori özeti
 * @param {Array} workouts - Antrenman dizisi
 * @returns {Object} { totalCalories, averagePerWorkout, highestSession }
 */
export function getCaloriesSummary(workouts) {
  if (!workouts || workouts.length === 0) {
    return {
      totalCalories: 0,
      averagePerWorkout: 0,
      highestSession: 0
    };
  }
  
  const calories = workouts.map(w => w.calories || 0);
  const total = calories.reduce((sum, cal) => sum + cal, 0);
  
  return {
    totalCalories: total,
    averagePerWorkout: Math.round(total / workouts.length),
    highestSession: Math.max(...calories)
  };
}

/**
 * Günlük kalori hedefi kontrolü
 * @param {number} burnedCalories - Yakılan kalori
 * @param {number} goalCalories - Hedef kalori (varsayılan: 300)
 * @returns {Object} { achieved, percentage, remaining }
 */
export function checkDailyGoal(burnedCalories, goalCalories = 300) {
  const percentage = Math.min(Math.round((burnedCalories / goalCalories) * 100), 100);
  const remaining = Math.max(goalCalories - burnedCalories, 0);
  
  return {
    achieved: burnedCalories >= goalCalories,
    percentage,
    remaining
  };
}

/**
 * Kalori kategorisi (motivasyon için)
 * @param {number} calories 
 * @returns {Object} { level, message, emoji }
 */
export function getCalorieLevel(calories) {
  if (calories >= 500) {
    return {
      level: 'Legendary',
      message: 'Incredible performance! 🔥',
      emoji: '🔥',
      color: 'red'
    };
  } else if (calories >= 300) {
    return {
      level: 'Great',
      message: 'Super workout! 💪',
      emoji: '💪',
      color: 'orange'
    };
  } else if (calories >= 150) {
    return {
      level: 'Good',
      message: 'Great job! 👍',
      emoji: '👍',
      color: 'yellow'
    };
  } else if (calories >= 50) {
    return {
      level: 'Beginner',
      message: 'Good start! 🌱',
      emoji: '🌱',
      color: 'green'
    };
  } else {
    return {
      level: 'Light',
      message: 'Keep going! 💫',
      emoji: '💫',
      color: 'blue'
    };
  }
}

/**
 * Haftalık kalori trendi
 * @param {Array} workouts - Son 7 günün antrenmanları
 * @returns {Array} [{ date, calories }, ...]
 */
export function getWeeklyCalorieTrend(workouts) {
  const last7Days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayWorkouts = workouts.filter(w => 
      w.timestamp && w.timestamp.startsWith(dateStr)
    );
    
    const totalCalories = dayWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    
    last7Days.push({
      date: dateStr,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      calories: totalCalories
    });
  }
  
  return last7Days;
}