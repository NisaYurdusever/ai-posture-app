import React, { useState, useEffect } from 'react';
// Bileşenleri uygulamanın farklı görünümlerini import ettik
import WelcomeScreen from './components/WelcomeScreen';
import AuthScreen from './components/AuthScreen';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './components/Dashboard';
import WorkoutScreen from './components/WorkoutScreen';
import LanguageSwitcher from './components/LanguageSwitcher';
//servisler veri çekme ve kaydetme işlemleri için
import { loadUserProfile, saveUserProfile, onAuthChange } from './services/storageService';
import { useLanguage } from './context/LanguageContext';

function App() {
  const { t } = useLanguage();

  //State kısmı
  //currentView: Uygulamanın hangi ekranını göreceğimizi belirler
  const [currentView, setCurrentView] = useState('loading');
  //userProfile: Kullanıcının profil bilgilerini tutar
  const [userProfile, setUserProfile] = useState(null);
  //selectedExercise: Kullanıcının seçtiği egzersizi tutar
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    // Sayfa ilk yüklendiğinde (veya yenilendiğinde) Firebase'in oturumu
    // geri yüklemesi bir miktar zaman alır, bu yüzden senkron bir kontrol
    // yerine onAuthChange dinleyicisinin ilk sonucunu bekliyoruz.
    let initialCheckDone = false;

    const unsubscribe = onAuthChange(async (username) => {
      if (initialCheckDone) return; // Sonraki değişiklikleri onAuthSuccess/onLogout yönetiyor
      initialCheckDone = true;

      if (!username) {
        setCurrentView('auth');// Kullanıcı yoksa giriş ekranına yönlendirir
        return;
      }

      const savedProfile = await loadUserProfile();// Kullanıcının profil bilgileri bulutta kayıtlı mı?
      if (savedProfile && savedProfile.profileComplete) {
        setUserProfile(savedProfile);// Profil bilgileri varsa state'e yükler
        setCurrentView('dashboard');// Profil varsa ana sayfaya (dashboard) git
      } else {
        setCurrentView('profile');// Profil yoksa kurulum ekranına git
      }
    });

    return () => unsubscribe();
  }, []);

  // Giriş işlemi başarılı olduğunda gelir
  const handleAuthSuccess = async () => {
    const savedProfile = await loadUserProfile();
    if (savedProfile && savedProfile.profileComplete) {
      setUserProfile(savedProfile);
      setCurrentView('dashboard');// Profil bilgileri varsa doğrudan ana sayfaya git
    } else {
      setCurrentView('welcome');// Yeni kullanıcıysa hoş geldin ekranına gönder
    }
  };

  // Profil bilgileri doldurulup "Tamamla" denildiğinde tetiklenir
  const handleProfileComplete = async (profile) => {
    const completeProfile = { ...profile, profileComplete: true };
    await saveUserProfile(completeProfile);// Profil bilgilerini buluta kaydeder
    // username gibi hesap oluşturulurken yazılan alanlar formda yok,
    // bu yüzden kaydettikten sonra birleşmiş (merge edilmiş) hâliyle
    // Firestore'dan tekrar okuyoruz.
    const freshProfile = await loadUserProfile();
    setUserProfile(freshProfile || completeProfile);
    setCurrentView('dashboard');// Profil tamamlandıktan sonra ana sayfaya yönlendirir
  };


  //Ara yüz kısmı

  // Uygulama hala yükleniyor durumunda gösterilecek ekran
  if (currentView === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  //ana uygulama arayüzü, currentView durumuna göre farklı bileşenler render eder koşullu ekran gösterimi yapar
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* YENİ: Dil seçici her ekranda sabit köşede görünür - Dashboard ve
          WorkoutScreen dahil (o iki dosya henüz çevrilmedi ama seçici zaten
          burada global olarak duruyor, o dosyalar çevrildiğinde otomatik
          işe yarayacak). */}
      <LanguageSwitcher className="fixed top-4 right-4 z-50" />

      {currentView === 'auth' && (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}

      {currentView === 'welcome' && (
        <WelcomeScreen onStart={() => setCurrentView('profile')} />
      )}
      
      {currentView === 'profile' && (
        <ProfileSetup onComplete={handleProfileComplete} />
      )}
      
      {currentView === 'dashboard' && (
        <Dashboard 
          userProfile={userProfile}
          onSelectExercise={(exercise) => {
            setSelectedExercise(exercise);
            setCurrentView('workout');// Egzersiz seçildiğinde workout ekranına geçiş yapar
          }}
          onLogout={() => {
            setUserProfile(null);
            setCurrentView('auth');//çıkış yapınca başa dön
          }}
        />
      )}

      {currentView === 'workout' && (
        <WorkoutScreen
          exercise={selectedExercise}
          userProfile={userProfile}
          onExit={() => setCurrentView('dashboard')}// Workout ekranından çıkış yapıldığında dashboard ekranına geçiş yapar
        />
      )}
    </div>
  );
}

export default App;
