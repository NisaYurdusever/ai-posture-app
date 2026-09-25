/**
 * Hava durumu servisi - Open-Meteo API kullanıyor (https://open-meteo.com).
 *
 * NEDEN BU API: API KEY GEREKTİRMİYOR - ticari olmayan/kişisel kullanım
 * için tamamen ücretsiz, kayıt bile gerekmiyor. OpenWeatherMap gibi key
 * yönetimi (ve yanlışlıkla repoya key sızdırma riski) gerektiren servisler
 * yerine bunu seçtik.
 *
 * Konum, kullanıcıdan tarayıcı üzerinden istenir (navigator.geolocation).
 * Kullanıcı izni reddederse veya özelliği hiç açmak istemezse, bu servis
 * hiç çağrılmaz - su hedefi sadece profil bilgilerine (kilo/yaş/boy/
 * egzersiz) göre hesaplanmaya devam eder. Yani hava durumu TAMAMEN opsiyonel.
 */
export async function fetchCurrentTemperature(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Weather request failed');
  }
  const data = await response.json();
  const temp = data?.current?.temperature_2m;
  return typeof temp === 'number' ? temp : null;
}

/**
 * Tarayıcıdan konum izni ister ve verilirse enlem/boylam döndürür.
 * Reddedilirse veya desteklenmiyorsa reject eder - çağıran taraf (WaterTracker)
 * bunu sessizce yakalayıp özelliği devre dışı bırakıyor, hata göstermiyor.
 */
export function requestUserLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(error),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}