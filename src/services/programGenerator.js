import { getPhaseInfo } from '../utils/cycleCalculator';
import { calculateCalories, estimateDuration } from '../utils/calorieCalculator';
import exercisesData from '../data/exercises.json';

/**
 * Kullanıcı profiline göre haftalık egzersiz programı oluştur
 * @param {Object} userProfile - { gender, height, weight, targetMuscles, cycleDay }
 * @returns {Object} weeklyProgram
 */
export function generateWeeklyProgram(userProfile) {
  const { gender, cycleDay, targetMuscles, fitnessLevel } = userProfile;
  
  const program = {
    generatedAt: new Date().toISOString(),
    userInfo: {
      gender,
      targetMuscles
    },
    days: []
  };

  // Kadınlar için hormonal döngü bazlı
  if (gender === 'Female' && cycleDay) {
    program.cycle = generateCycleBasedProgram(cycleDay, targetMuscles);
    if (program.cycle.recommendations) {
      scaleRecommendationsByFitnessLevel(program.cycle.recommendations, fitnessLevel);
    }
  } else {
    // Erkekler için circadian rhythm bazlı
    program.weekly = generateCircadianProgram(targetMuscles);
    scaleRecommendationsByFitnessLevel(program.weekly.weeklySchedule, fitnessLevel);
  }

  return program;
}

/**
 * Fitness seviyesine göre çarpanlar. 'intermediate' = mevcut varsayılan
 * değerler (referans noktası, hiç ölçeklenmez). 'beginner' daha az
 * hacim/daha uzun dinlenme, 'advanced' daha fazla hacim/daha kısa dinlenme.
 */
function getFitnessMultiplier(fitnessLevel) {
  switch (fitnessLevel) {
    case 'advanced': return { reps: 1.3, sets: 1, duration: 1.3, rest: -15 };
    case 'beginner': return { reps: 0.7, sets: -1, duration: 0.7, rest: 15 };
    case 'intermediate':
    default: return { reps: 1.0, sets: 0, duration: 1.0, rest: 0 };
  }
}

function scaleRepsRange(rangeStr, multiplier) {
  if (typeof rangeStr !== 'string') return rangeStr;
  const match = rangeStr.match(/^(\d+)-(\d+)$/);
  if (!match) return rangeStr; // "30 second sprint" gibi metinsel değerlere dokunma
  const min = Math.max(1, Math.round(parseInt(match[1]) * multiplier));
  const max = Math.max(min, Math.round(parseInt(match[2]) * multiplier));
  return `${min}-${max}`;
}

function scaleSets(sets, adjustment) {
  return Math.max(2, sets + adjustment);
}

function scaleDuration(duration, multiplier) {
  return Math.max(10, Math.round(duration * multiplier));
}

/**
 * Oluşturulmuş programı (günlük öneriler dizisini) fitness seviyesine göre
 * tek geçişte ölçekler - sets/reps/restTime ve her günün içindeki tekil
 * egzersizlerin reps/duration alanları dahil.
 */
function scaleRecommendationsByFitnessLevel(days, fitnessLevel) {
  const mult = getFitnessMultiplier(fitnessLevel);
  if (!Array.isArray(days)) return;

  days.forEach(day => {
    if (typeof day.sets === 'number') {
      day.sets = scaleSets(day.sets, mult.sets);
    }
    if (typeof day.reps === 'string') {
      day.reps = scaleRepsRange(day.reps, mult.reps);
    }
    if (typeof day.restTime === 'number') {
      day.restTime = Math.max(20, Math.round(day.restTime + mult.rest));
    }
    if (Array.isArray(day.exercises)) {
      day.exercises.forEach(ex => {
        if (typeof ex.reps === 'string') ex.reps = scaleRepsRange(ex.reps, mult.reps);
        if (typeof ex.duration === 'number') ex.duration = scaleDuration(ex.duration, mult.duration);
        if (typeof ex.sets === 'number') ex.sets = scaleSets(ex.sets, mult.sets);
      });
    }
  });
}

/**
 * Kadınlar için döngü bazlı program (28 gün)
 */
function generateCycleBasedProgram(currentCycleDay, targetMuscles) {
  const day = parseInt(currentCycleDay);
  const phaseInfo = getPhaseInfo(day);
  
  if (!phaseInfo) {
    return getDefaultProgram(targetMuscles);
  }

  const program = {
    currentPhase: phaseInfo.phase,
    currentDay: day,
    intensity: phaseInfo.intensity,
    recommendations: []
  };

  // Faz 1: Foliküler (1-7. günler) - YÜKSEK ENERJİ
  if (day >= 1 && day <= 7) {
    program.recommendations = [
      {
        day: 'Monday',
        focus: 'Strength Training',
        exercises: getExercisesForIntensity('high', targetMuscles),
        sets: 4,
        reps: '10-12',
        restTime: 60,
        notes: 'You are at your peak energy level!Train with heavier weights and focus on compound movements.'
      },
      {
        day: 'Wednesday',
        focus: 'Strength + Cardio',
        exercises: getExercisesForIntensity('high', targetMuscles),
        sets: 3,
        reps: '12-15',
        restTime: 45,
        notes: 'HIIT or moderate cardio can be added to your strength training for optimal results.'
      },
      {
        day: 'Friday',
        focus: 'Muscle Hypertrophy',
        exercises: getExercisesForIntensity('high', targetMuscles),
        sets: 4,
        reps: '8-10',
        restTime: 90,
        notes: 'Focus on muscle growth with moderate to heavy weights and slightly longer rest periods.'
      },
      {
        day: 'Saturday',
        focus: 'Active Recovery',
        exercises: [{ id: 'plank', name: 'Plank', duration: 45 }],
        notes: 'Light activity like yoga, stretching, or a leisurely walk to promote recovery.'
      }
    ];
  }
  
  // Faz 2: Ovülasyon (8-14. günler) - MAKSİMUM GÜÇ
  else if (day >= 8 && day <= 14) {
    program.recommendations = [
      {
        day: 'Monday',
        focus: 'Maximum Strength',
        exercises: getExercisesForIntensity('maximum', targetMuscles),
        sets: 5,
        reps: '6-8',
        restTime: 120,
        notes: 'Perfect time for personal records! Lift the heaviest weights.'
      },
      {
        day: 'Tuesday',
        focus: 'HIIT Cardio',
        exercises: getExercisesForIntensity('maximum', targetMuscles),
        sets: 4,
        reps: '30 saniye sprint',
        restTime: 30,
        notes: 'Endurance and cardiovascular performance peak. Great for high-intensity interval training.'
      },
      {
        day: 'Thursday',
        focus: 'Compound Movements',
        exercises: getExercisesForIntensity('maximum', targetMuscles),
        sets: 4,
        reps: '8-10',
        restTime: 90,
        notes: 'Multi-joint movements such as squats and deadlifts.'
      },
      {
        day: 'Saturday',
        focus: 'Strength Endurance',
        exercises: getExercisesForIntensity('high', targetMuscles),
        sets: 3,
        reps: '15-20',
        restTime: 45,
        notes: 'High repetitions, medium weight. Focus on muscular endurance and form.'
      }
    ];
  }
  
  // Faz 3: Luteal Erken (15-21. günler) - ORTA YoĞUNLUK
  else if (day >= 15 && day <= 21) {
    program.recommendations = [
      {
        day: 'Monday',
        focus: 'Moderate Intensity Strength',
        exercises: getExercisesForIntensity('moderate', targetMuscles),
        sets: 3,
        reps: '12-15',
        restTime: 60,
        notes: 'Increase rest periods. Focus on form and moderate weights to avoid overtraining as energy starts to dip.'
      },
      {
        day: 'Wednesday',
        focus: 'Cardio + Core',
        exercises: [
          { id: 'plank', name: 'Plank', duration: 60 },
          ...getExercisesForIntensity('moderate', targetMuscles).slice(0, 2)
        ],
        sets: 3,
        reps: '10-12',
        restTime: 60,
        notes: 'Moderate-intensity cardio (walking, cycling) combined with core exercises to maintain fitness without overexertion.'
      },
      {
        day: 'Friday',
        focus: 'Light Strength',
        exercises: getExercisesForIntensity('moderate', targetMuscles),
        sets: 2,
        reps: '15',
        restTime: 45,
        notes: 'Lightweight, form-focused. Avoid heavy lifting as energy levels may be lower.'
      }
    ];
  }
  
  // Faz 4: Luteal Geç / Menstrual (22-28. günler) - DÜŞÜK YoĞUNLUK
  else {
    program.recommendations = [
      {
        day: 'Monday',
        focus: 'Light Yoga / Pilates',
        exercises: [{ id: 'plank', name: 'Plank', duration: 30 }],
        notes: 'Focused on flexibility and mobility. Avoid intense workouts. Gentle yoga or pilates can help with bloating and cramps.'
      },
      {
        day: 'Wednesday',
        focus: 'Slow Cardio',
        exercises: [],
        notes: '20-30 minutes of walking or light cycling. Keep it easy and listen to your body.'
      },
      {
        day: 'Friday',
        focus: 'Stretching + Recovery',
        exercises: [{ id: 'plank', name: 'Plank', duration: 20 }],
        notes: 'Rest is a priority, listen to your body. Gentle stretching and mobility work can help reduce PMS symptoms.'
      }
    ];
  }

  return program;
}

/**
 * Erkekler için circadian rhythm bazlı program
 */
function generateCircadianProgram(targetMuscles) {
  return {
    weeklySchedule: [
      {
        day: 'Monday',
        timeOfDay: 'Morning (6-10)',
        focus: 'Strength Training',
        exercises: getExercisesForIntensity('high', targetMuscles),
        sets: 4,
        reps: '8-10',
        notes: 'Testosterone levels are at their highest. Lift heavy!'
      },
      {
        day: 'Tuesday',
        timeOfDay: 'Afternoon (14-18)',
        focus: 'HIIT + Cardio',
        exercises: getExercisesForIntensity('maximum', targetMuscles),
        sets: 4,
        reps: '20 second sprint',
        notes: 'Body temperature at its peak, maximum performance. Great for high-intensity training.'
      },
      {
        day: 'Wednesday',
        timeOfDay: 'Morning (6-10)',
        focus: 'Strength + Hypertrophy',
        exercises: getExercisesForIntensity('high', targetMuscles),
        sets: 3,
        reps: '10-12',
        notes: 'Compound movements'
      },
      {
        day: 'Thursday',
        timeOfDay: 'Evening (18-21)',
        focus: 'Light Cardio',
        exercises: getExercisesForIntensity('moderate', targetMuscles),
        sets: 3,
        reps: '15',
        notes: 'Lower energy levels, focus on recovery. Light cardio or active recovery exercises.'
      },
      {
        day: 'Friday',
        timeOfDay: 'Afternoon (14-18)',
        focus: 'Maximum Strength',
        exercises: getExercisesForIntensity('maximum', targetMuscles),
        sets: 5,
        reps: '6-8',
        notes: 'Body temperature peaks, ideal for maximum performance. Perfect for heavy lifting and intense cardio.'
      },
      {
        day: 'Saturday',
        timeOfDay: 'Morning (8-12)',
        focus: 'Active Recovery',
        exercises: [{ id: 'plank', name: 'Plank', duration: 60 }],
        notes: 'Light activity like yoga, stretching, or a leisurely walk to promote recovery.'},
      {
        day: 'Sunday',
        timeOfDay: 'Full Rest',
        focus: 'Recovery',
        exercises: [],
        notes: 'Full rest day to allow for complete recovery.'
      }
    ]
  };
}

/**
 * Yoğunluğa göre egzersiz seç
 */
function getExercisesForIntensity(intensity, targetMuscles) {
  const isFullBody = targetMuscles.includes('Full Body');
  const filtered = isFullBody
    ? exercisesData
    : exercisesData.filter(ex =>
        targetMuscles.some(muscle => ex.targetMuscles.includes(muscle))
      );

  if (filtered.length === 0) {
    return exercisesData.slice(0, 3); // Default olarak ilk 3
  }

  // Yoğunluğa göre tekrar/süre ayarla
  return filtered.map(ex => ({
    id: ex.id,
    name: ex.name,
    type: ex.type,
    sets: intensity === 'maximum' ? 5 : intensity === 'high' ? 4 : 3,
    reps: ex.type === 'reps' ? getRepsForIntensity(intensity) : undefined,
    duration: ex.type === 'timed' ? getDurationForIntensity(intensity) : undefined,
    difficulty: ex.difficulty
  }));
}

function getRepsForIntensity(intensity) {
  switch(intensity) {
    case 'maximum': return '6-8';
    case 'high': return '10-12';
    case 'moderate': return '12-15';
    case 'low': return '15-20';
    default: return '10-12';
  }
}

function getDurationForIntensity(intensity) {
  switch(intensity) {
    case 'maximum': return 60;
    case 'high': return 45;
    case 'moderate': return 30;
    case 'low': return 20;
    default: return 30;
  }
}

function getDefaultProgram(targetMuscles) {
  const isFullBody = targetMuscles.includes('Full Body');
  return {
    recommendations: [
      {
        day: 'Everyday',
        exercises: isFullBody
          ? exercisesData
          : exercisesData.filter(ex =>
              targetMuscles.some(muscle => ex.targetMuscles.includes(muscle))
            ),
        notes: 'Default program'
      }
    ]
  };
}

/**
 * Program özetini metne çevir
 */
export function getProgramSummary(program, userProfile) {
  if (userProfile.gender === 'Female' && program.cycle) {
    const { currentPhase, intensity, recommendations } = program.cycle;
    return {
      title: currentPhase,
      intensity,
      daysThisWeek: recommendations.length,
      message: `${currentPhase} period of ${intensity.toLowerCase()} intensity training is recommended. This week ${recommendations.length} days of training have been planned.`
    };
  } else if (program.weekly) {
    return {
      title: 'Weekly Program',
      daysThisWeek: program.weekly.weeklySchedule.filter(d => d.exercises.length > 0).length,
      message: `${program.weekly.weeklySchedule.length} daily schedule optimized according to Circadian rhythm.`
    };
  }
  return null;
}

/**
 * YENİ: Bir günün egzersiz listesine göre TAHMİNİ kalori miktarını hesaplar
 * - kullanıcının kendi kilosuna göre (calorieCalculator'daki MET tabanlı
 * formülü kullanır). "Weekly Program" kartını daha kişiselleştirilmiş/
 * detaylı göstermek için Dashboard'da kullanılıyor. Egzersiz reps aralığı
 * bir string ise ("10-12" gibi) ortalamasını, süreli egzersizlerde direkt
 * duration'ı baz alır. Kesin bir ölçüm değil, kaba bir tahmindir.
 */
export function getEstimatedDayCalories(day, weight) {
  if (!day?.exercises || day.exercises.length === 0 || !weight) return 0;

  let total = 0;
  day.exercises.forEach(ex => {
    const sets = ex.sets || 1;
    if (ex.reps) {
      const match = typeof ex.reps === 'string' ? ex.reps.match(/(\d+)\s*-\s*(\d+)/) : null;
      const repsCount = match
        ? Math.round((parseInt(match[1]) + parseInt(match[2])) / 2)
        : (parseInt(ex.reps) || 10);
      const duration = estimateDuration(ex.id, repsCount) * sets;
      total += calculateCalories(ex.id, weight, duration, repsCount * sets);
    } else if (ex.duration) {
      total += calculateCalories(ex.id, weight, ex.duration * sets, 0);
    }
  });

  return Math.round(total);
}