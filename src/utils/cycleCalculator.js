import cyclePhases from '../data/cyclePhases.json';// Döngü fazları bilgilerini içeren JSON dosyasını içe aktarır

/**
 * Verilen döngü gününe göre faz bilgisini döndürür
 * @param {number} cycleDay - Döngü günü (1-28)
 * @returns {object} - Faz bilgileri
 */
export function getPhaseInfo(cycleDay) {// Döngü gününe göre faz bilgilerini döndürür
  const day = parseInt(cycleDay);
  
  if (!day || day < 1 || day > 28) {// Geçersiz döngü günü için null döndürür
    return null;
  }

  const phase = cyclePhases.find(phase => 
    phase.days.includes(day)
  );

  return phase || null;
}

/**
 * Kadın ve erkek için optimal antrenman zamanını hesaplar
 * @param {string} gender - Cinsiyet
 * @param {number} cycleDay - Döngü günü (sadece kadınlar için)
 * @returns {object} - Önerilen antrenman bilgileri
 */
export function getOptimalWorkoutTime(gender, cycleDay = null) {
  if (gender === 'Female' && cycleDay) {
    const phase = getPhaseInfo(cycleDay);
    return {
      intensity: phase?.intensity || 'intermediate',
      energyLevel: phase?.energyLevel || 'moderate',
      recommendations: phase?.tips || []
    };
  }

  // Erkekler için circadian rhythm bazlı
  const currentHour = new Date().getHours();
  
  if (currentHour >= 6 && currentHour < 12) {
    return {
      intensity: 'High',
      energyLevel: 'high',
      recommendations: [
        'Morning energy and testosteron peak',
        'Heavy lifting and strength training ideal',
        'You can also do cardio, but focus on weights'
      ]
    };
  } else if (currentHour >= 14 && currentHour < 18) {
    return {
      intensity: 'Maximum',
      energyLevel: 'maximum',
      recommendations: [
        'Body temperature peaks',
        'Ideal for maximum performance',
        'Perfect for HIIT and intense cardio'
      ]
    };
  } else {
    return {
      intensity: 'Intermediate',
      energyLevel: 'moderate',
      recommendations: [
        'Light-moderate intensity exercise',
        'Stretching and yoga are ideal',
        'Avoid intense training sessions'
      ]
    };
  }
}

/**
 * Faz rengini döndürür (Tailwind class için)
 * @param {string} color - Renk adı
 * @returns {string} - Tailwind renk class'ı
 */
export function getPhaseColor(color) {
  const colorMap = {
    'cyan': 'cyan',
    'violet': 'violet',
    'fuchsia': 'fuchsia',
    'rose': 'rose'
  };
  return colorMap[color] || 'cyan';
}
