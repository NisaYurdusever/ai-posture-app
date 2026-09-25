/**
 * Su tüketimi hedefi hesaplama servisi.
 *
 * ÖNEMLİ: Bu GENEL bir tahmindir, tıbbi tavsiye DEĞİLDİR. Böbrek/kalp
 * rahatsızlığı, hamilelik, emzirme veya sıvı alımını kısıtlaması/artırması
 * gereken başka bir durum varsa doğru miktar için mutlaka bir doktora
 * danışılmalı. UI tarafında (WaterTracker.jsx) bu uyarı kullanıcıya da
 * gösteriliyor - burada silinmemeli.
 */

/**
 * Kilo/boy/yaş/cinsiyete göre genel bir günlük taban (ml) hesaplar.
 * Referans: yetişkinler için sıkça kullanılan ~33ml/kg kaba kuralı
 * (Institute of Medicine / NASEM'in genel yetişkin sıvı önerileriyle aynı
 * mertebede) - kişiye özel kesin bir doz değil, kaba bir başlangıç noktası.
 */
export function calculateBaseWaterML({ weight, height, age, gender }) {
  if (!weight || weight <= 0) return 2000; // güvenli genel varsayılan

  let base = weight * 33;

  // Boy: 170cm referans alınarak küçük bir düzeltme - daha uzun vücutlar
  // genelde biraz daha fazla toplam vücut suyuna sahiptir. Küçük bir katkı,
  // ana belirleyici hâlâ kilo.
  if (height) {
    base += (height - 170) * 3;
  }

  // Yaş: çok genel bir varsayım - kesin bir tıbbi kural değil.
  if (age) {
    if (age >= 55) base *= 0.93;
    else if (age < 18) base *= 0.9;
  }

  // Cinsiyet: genel popülasyon ortalamalarına dayalı hafif bir fark
  // (vücut suyu oranı farkı) - bireysel farklılıklar bundan çok daha
  // belirleyici olabilir, bu sadece kaba bir varsayılan.
  if (gender === 'Male') {
    base *= 1.05;
  }

  return Math.round(base);
}

/**
 * Bugün tamamlanan antrenmanların toplam süresine göre ekstra su önerisi.
 * Kaba kural: ~30 dakika orta/yüksek yoğunluklu egzersiz için +400ml.
 */
export function getExerciseWaterBonusML(workoutHistory = []) {
  const today = new Date().toISOString().split('T')[0];
  const todaysWorkouts = workoutHistory.filter(w => {
    const ts = w.timestamp || w.date || '';
    return typeof ts === 'string' && ts.startsWith(today);
  });
  const totalSeconds = todaysWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const totalMinutes = totalSeconds / 60;
  return Math.round((totalMinutes / 30) * 400);
}

/**
 * Sıcaklığa göre ekstra su önerisi (opsiyonel - hava durumu verisi varsa).
 * 25°C üstü her derece için kaba bir ek miktar, 1000ml ile sınırlı.
 * Kullanıcı hava durumu paylaşmak istemezse bu fonksiyon hiç çağrılmaz,
 * temperature=null geçilir ve hedef sadece profil bilgilerine göre hesaplanır.
 */
export function getWeatherWaterBonusML(temperatureC) {
  if (temperatureC == null || Number.isNaN(temperatureC)) return 0;
  if (temperatureC <= 25) return 0;
  return Math.min(1000, Math.round((temperatureC - 25) * 40));
}

/**
 * Hepsini birleştiren toplam günlük su hedefi (ml).
 * `temperature` opsiyoneldir - kullanıcı hava durumu paylaşmadıysa null geçilir.
 */
export function calculateWaterTargetML({ weight, height, age, gender, workoutHistory, temperature }) {
  const base = calculateBaseWaterML({ weight, height, age, gender });
  const exerciseBonus = getExerciseWaterBonusML(workoutHistory);
  const weatherBonus = getWeatherWaterBonusML(temperature);
  return base + exerciseBonus + weatherBonus;
}