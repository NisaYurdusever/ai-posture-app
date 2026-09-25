# Firebase Kurulumu

Bu proje artık kullanıcı hesaplarını ve leaderboard'u gerçek bir bulut
veritabanında (Firebase) tutuyor. Çalıştırmadan önce kendi Firebase
projeni oluşturup bağlaman gerekiyor - bu adımları sen yapmalısın çünkü
Google hesabın gerekiyor.

## 1) Firebase projesi oluştur

1. https://console.firebase.google.com adresine git, Google hesabınla giriş yap.
2. "Add project" -> bir isim ver (örn. `ai-posture-app`) -> devam et.
3. Google Analytics'i istersen kapatabilirsin, gerekli değil.

## 2) Authentication'ı aç

1. Sol menü: **Build > Authentication** -> "Get started".
2. "Sign-in method" sekmesi -> **Email/Password** -> etkinleştir -> kaydet.
3. Aynı sekmede **Google** sağlayıcısını da etkinleştir (Google ile giriş için
   gerekli) -> destek e-postanı seç -> kaydet.
3. Aynı sekmede **Google** sağlayıcısına tıkla -> etkinleştir -> proje destek
   e-postanı seç -> kaydet. (Google ile giriş butonu için gerekli.)

## 3) Firestore veritabanını aç

1. Sol menü: **Build > Firestore Database** -> "Create database".
2. "Start in production mode" seç.
3. Sana coğrafi olarak yakın bir bölge seç (örn. `eur3 (europe-west)`).

Veritabanı oluştuktan sonra **Rules** sekmesine gidip aşağıdakini yapıştır
ve "Publish" de:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;

      match /workouts/{workoutId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Bu kurallar: giriş yapmış herkes leaderboard için diğer kullanıcıların
özet verilerini (kullanıcı adı, toplam kalori, streak) okuyabilir, ama
sadece kendi verisini yazabilir/değiştirebilir.

## 4) Web app kaydı ve anahtarları alma

1. Sol üstte dişli ikonu -> **Project settings**.
2. Aşağı in, "Your apps" -> `</>` (Web) simgesine tıkla.
3. Bir isim ver (örn. `ai-posture-web`), "Register app" de.
4. Karşına çıkan `firebaseConfig` objesindeki değerleri kullanacaksın.

## 5) .env dosyasını oluştur

Proje kök dizininde `.env.example` dosyasını kopyalayıp `.env` olarak
kaydet ve 4. adımda aldığın değerlerle doldur:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=ai-posture-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-posture-app
VITE_FIREBASE_STORAGE_BUCKET=ai-posture-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

`.env` dosyası `.gitignore`'da olduğu için hg/git deponuza gönderilmez -
gerçek anahtarların dışarı sızma riski yok.

## 6) Vercel'e deploy ediyorsan

Vercel proje ayarlarında **Settings > Environment Variables** kısmına
yukarıdaki 6 değeri tek tek ekle (aynı isimlerle), yoksa canlıda
"Firebase config eksik" hatası alırsın.

## Not: Eski localStorage verileri

Önceki localStorage tabanlı hesaplar/veriler bu geçişle otomatik
taşınmıyor - herkesin (sen dahil) yeni bir hesap açması gerekecek.
Demo/test amaçlı olduğu için bu bir sorun değil.
