/**
 * Türkçe dil desteği - çeviri sözlükleri.
 *
 * NOT: Buradaki anahtarlar sadece EKRANDA GÖSTERİLEN metinler için.
 * userProfile.gender ('Female'/'Male'), fitnessLevel ('beginner'/
 * 'intermediate'/'advanced') ve targetMuscles ('Legs', 'Full Body' vb.)
 * gibi kod içinde mantık/karşılaştırma için kullanılan DEĞERLER burada
 * DEĞİŞMİYOR - sadece ekrana yazılan karşılıkları (common.gender,
 * common.muscles, common.fitnessLevels) çevriliyor.
 *
 * BİLİNEN EKSİKLER (henüz bu oturumda paylaşılmadığı için çevrilmedi):
 * - Dashboard.jsx, WorkoutScreen.jsx (workout HUD, weekly program ekranı)
 * - storageService.js / exerciseAnalyzer.js içindeki olası kullanıcıya
 *   gösterilen metinler
 * - geminiService.js'teki kural-tabanlı chatbot cevaplarının GÖVDESİ
 *   (sadece AIChatbot.jsx'in çerçevesi - başlık, buton, placeholder vb. -
 *   çevrildi)
 */

export const translations = {
  en: {
    common: {
      loading: 'Loading...',
      back: 'Back',
      cancel: 'Cancel',
      gender: { Female: 'Female', Male: 'Male' },
      muscles: {
        Legs: 'Legs',
        Arms: 'Arms',
        Chest: 'Chest',
        Abs: 'Abs',
        Back: 'Back',
        Shoulders: 'Shoulders',
        Hips: 'Hips',
        'Full Body': 'Full Body'
      },
      fitnessLevels: {
        beginner: { label: 'Just starting out', hint: 'New to exercise' },
        intermediate: { label: 'Somewhat active', hint: 'Some experience' },
        advanced: { label: 'Very experienced', hint: 'Regular training' }
      }
    },
    app: {
      loading: 'Loading...'
    },
    welcome: {
      title: 'AI Posture Coach',
      tagline: 'Professional coaching experience at home.',
      description:
        'Train safely and effectively with AI-powered real-time posture analysis. Personalized program and voice feedback tailored to your hormonal balance.',
      start: 'Start',
      features: {
        realtime: 'Real-Time Analysis',
        personalized: 'Personalized Program',
        progress: 'Progress Tracking'
      }
    },
    auth: {
      title: 'AI Posture Coach',
      signInSubtitle: 'Sign in to your account',
      signUpSubtitle: 'Create a new account',
      continueWithGoogle: 'Continue with Google',
      or: 'or',
      displayName: 'Display name',
      displayNamePlaceholder: 'How others will see you',
      email: 'Email',
      password: 'Password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      processing: 'Processing...',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      genericError: 'An error occurred.',
      features: {
        aiSupport: 'AI Support',
        progressTracking: 'Progress Tracking',
        personalizedProgram: 'Personalized Program'
      }
    },
    profileSetup: {
      title: 'Create Your Profile',
      subtitle: "We need a few details to create your personalized workout plan",
      genderLabel: 'Gender',
      cycleDayLabel: 'Cycle Day (1-28)',
      cycleDayPlaceholder: 'Example: 14',
      cycleDayNote: 'Based on your hormonal balance, we will create an optimal program',
      ageLabel: 'Age',
      heightLabel: 'Height (cm)',
      weightLabel: 'Weight (kg)',
      fitnessLabel: 'How much exercise experience do you have?',
      fitnessHint:
        'This helps us set a comfortable starting point for form feedback - you can change it anytime in Settings as you improve.',
      targetMusclesLabel: 'Target Muscles (multi-select)',
      continue: 'Continue'
    },
    settings: {
      back: 'Back',
      title: 'Settings',
      subtitle: 'Update your profile information',
      language: 'Language',
      fillAllFields: 'Please fill in all fields!',
      selectMuscle: 'Please select at least one target muscle!',
      saved: 'Settings saved! ✅',
      genderLabel: 'Gender',
      male: '👨 Male',
      female: '👩 Female',
      ageLabel: 'Age',
      heightLabel: 'Height (cm)',
      weightLabel: 'Weight (kg)',
      cycleTitle: 'Menstrual Cycle Day',
      cycleNote: 'Enter a value between 1-28 (first day = 1)',
      fitnessTitle: 'Exercise Experience',
      fitnessHint: 'Getting more consistent? Bump this up for stricter form feedback.',
      colorblindTitle: 'Colorblind-friendly mode',
      colorblindDesc:
        "Swaps red/green feedback for blue/orange and adds distinct icons, so form feedback doesn't rely on color alone.",
      targetMusclesTitle: 'Target Muscle Groups',
      selected: 'Selected:',
      notSelected: 'Not selected yet',
      saveChanges: 'Save Changes',
      dangerZoneTitle: 'Danger Zone',
      dangerZoneDesc:
        'Deleting your account permanently removes your profile, workout history, and leaderboard entry. This cannot be undone.',
      deleteAccount: 'Delete my account',
      confirmDelete: 'Are you absolutely sure?',
      confirmDeleteYes: 'Yes, delete permanently',
      cancel: 'Cancel'
    },
    leaderboard: {
      title: 'Leaderboard',
      subtitle: 'The top performers',
      totalCalories: 'Total Calories',
      workoutCount: 'Workout Count',
      longestStreak: 'Longest Streak',
      loading: 'Loading leaderboard...',
      noData: 'No data yet',
      beFirst: 'Be the first to complete a workout!',
      workoutsThisWeek: 'workouts this week',
      you: 'You',
      kcal: 'kcal',
      workoutsUnit: 'workouts',
      dayStreak: 'day streak',
      climbTitle: 'Climb the Ranks!',
      climbDesc: 'Work out regularly and rise on the leaderboard 🚀'
    },
    progressChart: {
      caloriesBurned: 'Calories Burned',
      workouts: 'Workouts',
      totalCalories: 'Total Calories',
      kcalPerWeek: 'kcal / week',
      total: 'total',
      dailyAvg: 'Daily Avg.',
      kcalPerDay: 'kcal / day',
      mostActiveDay: 'Most Active Day',
      workoutsUnit: 'workouts',
      days: { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' }
    },
    water: {
      title: 'Water Intake',
      needAge: 'Add your age in Settings to get a personalized daily water target.',
      today: 'today',
      gettingLocation: 'Getting location...',
      adjustWeather: 'Adjust for weather (optional)',
      add250: '250 ml',
      add500: '500 ml',
      aboutEstimate: 'About this estimate',
      deniedLocation: "No location access - that's fine, using your profile info only.",
      weatherError: "Couldn't reach the weather service - using your profile info only.",
      infoText:
        "This target is a general estimate based on your weight, age, height, gender, today's exercise, and (if enabled) local temperature - it isn't medical advice. If you have a kidney, heart, or other condition affecting fluid intake, are pregnant, or feel unusually strained, please check the right amount for you with a doctor."
    },
    workoutComplete: {
      congrats: 'Congratulations! 🎉',
      completed: '{exercise} exercise completed!',
      duration: 'Duration',
      reps: 'Reps',
      calories: 'Calories',
      personalBest: 'Personal Best! 🏆',
      bestPerformance: 'Your best performance!',
      discard: 'Discard',
      save: 'Save'
    },
    chatbot: {
      tooltip: 'Talk with your AI Coach 🤖',
      headerTitle: 'AI Fitness Coach',
      headerSubtitle: 'Powered by Heuristic Logic',
      inputPlaceholder: 'Ask something...',
      disclaimer: 'AI responses may be inaccurate. Consult a professional for critical matters.',
      suggestedQuestions: '💡 Suggested Questions:',
      thinking: 'Thinking...',
      apiKeyMissing:
        '⚠️ API key not configured. Please add your Gemini API key to the `GEMINI_API_KEY` variable in `src/services/geminiService.js`.\n\n👉 To get an API key: https://aistudio.google.com/app/apikey',
      genericError: '❌ Sorry, an error occurred. Please try again or check your API key.',
      welcomeMessage:
        'Hello! 👋 I am your AI fitness coach. I can help you with exercises, nutrition{cycleClause} and training programs. How can I assist you?',
      welcomeCycleClause: ', hormonal cycle'
    },
    dashboard: {
      greetingMorning: 'Good Morning',
      greetingAfternoon: 'Good Afternoon',
      greetingEvening: 'Good Evening',
      readyForWorkout: 'Ready for your workout?',
      settings: 'Settings',
      logout: 'Logout',
      tabHome: '🏠 Home',
      tabLeaderboard: '🏆 Leaderboard',
      day: 'Day',
      intensity: 'Intensity:',
      weeklyProgramTitle: 'Weekly Program',
      hide: 'Hide',
      details: 'Details',
      doneThisWeek: 'done this week',
      markDone: 'Mark as done',
      markNotDone: 'Mark as not done',
      estimatedKcal: 'estimated for you',
      statThisWeek: 'This Week',
      statWorkouts: 'Workouts',
      statTotal: 'Total',
      statExercises: 'Exercises',
      statStreak: 'Streak',
      statStreakUnit: 'Day 🔥',
      todaysExercises: "Today's Exercises",
      progressChartTitle: 'Progress Chart',
      noWorkoutData: 'No workout data available yet',
      recommended: 'Recommended',
      timed: 'Timed',
      reps: 'Reps',
      begin: 'Begin',
      seconds: 'seconds',
      repsUnit: 'reps'
    },
    workoutScreen: {
      initialFeedback: 'Stand across the camera and press start!',
      aiReady: 'AI is ready! You can start now',
      aiFailed: 'AI could not be initialized, continuing in simulation mode',
      secondsKeepItUp: '{n} seconds! Keep it up!',
      cameraReady: 'Camera is ready! Press the button to start',
      cameraDenied: 'Camera access denied',
      started: 'Started! Pay attention to your form',
      resetMessage: 'Reset! Start when ready!',
      repAgainAmazing: '{count} Again! Amazing!',
      cameraStarting: 'Your camera is starting...',
      debugMode: 'Debug mode',
      guide: 'Guide',
      hideGuide: 'Hide guide',
      showGuide: 'Show guide',
      cameraActive: 'Camera active',
      connecting: 'Connecting...',
      pause: 'Pause',
      start: 'Start',
      reset: 'Reset',
      finishSave: 'Finish & Save',
      motivational: ['Amazing!', 'Super!', 'Keep Going!', 'Excellent form!', 'Great job!']
    }
  },

  tr: {
    common: {
      loading: 'Yükleniyor...',
      back: 'Geri',
      cancel: 'İptal',
      gender: { Female: 'Kadın', Male: 'Erkek' },
      muscles: {
        Legs: 'Bacaklar',
        Arms: 'Kollar',
        Chest: 'Göğüs',
        Abs: 'Karın',
        Back: 'Sırt',
        Shoulders: 'Omuzlar',
        Hips: 'Kalça',
        'Full Body': 'Tüm Vücut'
      },
      fitnessLevels: {
        beginner: { label: 'Yeni başlıyorum', hint: 'Egzersize yeniyim' },
        intermediate: { label: 'Biraz aktifim', hint: 'Biraz deneyimim var' },
        advanced: { label: 'Çok deneyimliyim', hint: 'Düzenli antrenman yapıyorum' }
      }
    },
    app: {
      loading: 'Yükleniyor...'
    },
    welcome: {
      title: 'AI Posture Coach',
      tagline: 'Evde profesyonel koçluk deneyimi.',
      description:
        'Yapay zekâ destekli gerçek zamanlı postür analiziyle güvenle ve etkili şekilde antrenman yap. Hormonal dengenize özel kişiselleştirilmiş program ve sesli geri bildirim.',
      start: 'Başla',
      features: {
        realtime: 'Gerçek Zamanlı Analiz',
        personalized: 'Kişiselleştirilmiş Program',
        progress: 'İlerleme Takibi'
      }
    },
    auth: {
      title: 'AI Posture Coach',
      signInSubtitle: 'Hesabına giriş yap',
      signUpSubtitle: 'Yeni bir hesap oluştur',
      continueWithGoogle: 'Google ile devam et',
      or: 'veya',
      displayName: 'Görünen ad',
      displayNamePlaceholder: 'Diğerleri seni böyle görecek',
      email: 'E-posta',
      password: 'Şifre',
      showPassword: 'Şifreyi göster',
      hidePassword: 'Şifreyi gizle',
      processing: 'İşleniyor...',
      signIn: 'Giriş Yap',
      signUp: 'Kayıt Ol',
      noAccount: 'Hesabın yok mu?',
      hasAccount: 'Zaten bir hesabın var mı?',
      genericError: 'Bir hata oluştu.',
      features: {
        aiSupport: 'AI Desteği',
        progressTracking: 'İlerleme Takibi',
        personalizedProgram: 'Kişisel Program'
      }
    },
    profileSetup: {
      title: 'Profilini Oluştur',
      subtitle: 'Sana özel antrenman planı oluşturmak için birkaç bilgiye ihtiyacımız var',
      genderLabel: 'Cinsiyet',
      cycleDayLabel: 'Döngü Günü (1-28)',
      cycleDayPlaceholder: 'Örnek: 14',
      cycleDayNote: 'Hormonal dengene göre en uygun programı oluşturacağız',
      ageLabel: 'Yaş',
      heightLabel: 'Boy (cm)',
      weightLabel: 'Kilo (kg)',
      fitnessLabel: 'Ne kadar egzersiz deneyimin var?',
      fitnessHint:
        "Bu bilgi, form geri bildirimi için rahat bir başlangıç noktası belirlememize yardımcı olur - istediğin zaman Ayarlar'dan değiştirebilirsin.",
      targetMusclesLabel: 'Hedef Kaslar (çoklu seçim)',
      continue: 'Devam Et'
    },
    settings: {
      back: 'Geri',
      title: 'Ayarlar',
      subtitle: 'Profil bilgilerini güncelle',
      language: 'Dil',
      fillAllFields: 'Lütfen tüm alanları doldur!',
      selectMuscle: 'Lütfen en az bir hedef kas seç!',
      saved: 'Ayarlar kaydedildi! ✅',
      genderLabel: 'Cinsiyet',
      male: '👨 Erkek',
      female: '👩 Kadın',
      ageLabel: 'Yaş',
      heightLabel: 'Boy (cm)',
      weightLabel: 'Kilo (kg)',
      cycleTitle: 'Adet Döngüsü Günü',
      cycleNote: '1-28 arasında bir değer gir (ilk gün = 1)',
      fitnessTitle: 'Egzersiz Deneyimi',
      fitnessHint: 'Daha düzenli mi oluyorsun? Daha sıkı form geri bildirimi için bunu yükselt.',
      colorblindTitle: 'Renk körü dostu mod',
      colorblindDesc:
        'Kırmızı/yeşil geri bildirimi mavi/turuncu ile değiştirir ve ayırt edici ikonlar ekler, böylece form geri bildirimi sadece renge bağlı olmaz.',
      targetMusclesTitle: 'Hedef Kas Grupları',
      selected: 'Seçili:',
      notSelected: 'Henüz seçilmedi',
      saveChanges: 'Değişiklikleri Kaydet',
      dangerZoneTitle: 'Tehlikeli Bölge',
      dangerZoneDesc:
        'Hesabını silmek profilini, antrenman geçmişini ve liderlik tablosu kaydını kalıcı olarak kaldırır. Bu işlem geri alınamaz.',
      deleteAccount: 'Hesabımı sil',
      confirmDelete: 'Tamamen emin misin?',
      confirmDeleteYes: 'Evet, kalıcı olarak sil',
      cancel: 'İptal'
    },
    leaderboard: {
      title: 'Liderlik Tablosu',
      subtitle: 'En iyi performans gösterenler',
      totalCalories: 'Toplam Kalori',
      workoutCount: 'Antrenman Sayısı',
      longestStreak: 'En Uzun Seri',
      loading: 'Liderlik tablosu yükleniyor...',
      noData: 'Henüz veri yok',
      beFirst: 'Bir antrenmanı tamamlayan ilk kişi ol!',
      workoutsThisWeek: 'bu hafta antrenman',
      you: 'Sen',
      kcal: 'kcal',
      workoutsUnit: 'antrenman',
      dayStreak: 'gün seri',
      climbTitle: 'Sıralamada Yüksel!',
      climbDesc: 'Düzenli antrenman yap ve liderlik tablosunda yüksel 🚀'
    },
    progressChart: {
      caloriesBurned: 'Yakılan Kalori',
      workouts: 'Antrenmanlar',
      totalCalories: 'Toplam Kalori',
      kcalPerWeek: 'kcal / hafta',
      total: 'toplam',
      dailyAvg: 'Günlük Ort.',
      kcalPerDay: 'kcal / gün',
      mostActiveDay: 'En Aktif Gün',
      workoutsUnit: 'antrenman',
      days: { Mon: 'Pzt', Tue: 'Sal', Wed: 'Çar', Thu: 'Per', Fri: 'Cum', Sat: 'Cmt', Sun: 'Paz' }
    },
    water: {
      title: 'Su Tüketimi',
      needAge: "Kişiselleştirilmiş günlük su hedefi için Ayarlar'dan yaşını ekle.",
      today: 'bugün',
      gettingLocation: 'Konum alınıyor...',
      adjustWeather: 'Havaya göre ayarla (opsiyonel)',
      add250: '250 ml',
      add500: '500 ml',
      aboutEstimate: 'Bu tahmin hakkında',
      deniedLocation: 'Konum erişimi yok - sorun değil, sadece profil bilgilerin kullanılıyor.',
      weatherError: 'Hava durumu servisine ulaşılamadı - sadece profil bilgilerin kullanılıyor.',
      infoText:
        'Bu hedef; kilon, yaşın, boyun, cinsiyetin, bugünkü egzersizin ve (etkinse) yerel sıcaklığa dayalı genel bir tahmindir - tıbbi tavsiye değildir. Böbrek, kalp veya sıvı alımını etkileyen başka bir rahatsızlığın varsa, hamileysen ya da olağandışı bir zorlanma hissediyorsan doğru miktar için lütfen bir doktora danış.'
    },
    workoutComplete: {
      congrats: 'Tebrikler! 🎉',
      completed: '{exercise} egzersizi tamamlandı!',
      duration: 'Süre',
      reps: 'Tekrar',
      calories: 'Kalori',
      personalBest: 'Kişisel Rekor! 🏆',
      bestPerformance: 'En iyi performansın!',
      discard: 'Vazgeç',
      save: 'Kaydet'
    },
    chatbot: {
      tooltip: 'AI Koçunla Konuş 🤖',
      headerTitle: 'AI Fitness Koçu',
      headerSubtitle: 'Kural Tabanlı Mantıkla Çalışır',
      inputPlaceholder: 'Bir şey sor...',
      disclaimer: 'AI yanıtları hatalı olabilir. Kritik konularda bir uzmana danış.',
      suggestedQuestions: '💡 Önerilen Sorular:',
      thinking: 'Düşünüyor...',
      apiKeyMissing:
        "⚠️ API anahtarı yapılandırılmamış. Lütfen `src/services/geminiService.js` dosyasındaki `GEMINI_API_KEY` değişkenine Gemini API anahtarını ekle.\n\n👉 API anahtarı almak için: https://aistudio.google.com/app/apikey",
      genericError: '❌ Üzgünüm, bir hata oluştu. Lütfen tekrar dene veya API anahtarını kontrol et.',
      welcomeMessage:
        'Merhaba! 👋 Ben senin AI fitness koçunum. Egzersizler, beslenme{cycleClause} ve antrenman programları konusunda sana yardımcı olabilirim. Nasıl yardımcı olabilirim?',
      welcomeCycleClause: ', hormonal döngü'
    },
    dashboard: {
      greetingMorning: 'Günaydın',
      greetingAfternoon: 'İyi Günler',
      greetingEvening: 'İyi Akşamlar',
      readyForWorkout: 'Antrenmana hazır mısın?',
      settings: 'Ayarlar',
      logout: 'Çıkış Yap',
      tabHome: '🏠 Ana Sayfa',
      tabLeaderboard: '🏆 Liderlik Tablosu',
      day: 'Gün',
      intensity: 'Yoğunluk:',
      weeklyProgramTitle: 'Haftalık Program',
      hide: 'Gizle',
      details: 'Detaylar',
      doneThisWeek: 'bu hafta tamamlandı',
      markDone: 'Tamamlandı olarak işaretle',
      markNotDone: 'Tamamlanmadı olarak işaretle',
      estimatedKcal: 'sana özel tahmini',
      statThisWeek: 'Bu Hafta',
      statWorkouts: 'Antrenman',
      statTotal: 'Toplam',
      statExercises: 'Egzersiz',
      statStreak: 'Seri',
      statStreakUnit: 'Gün 🔥',
      todaysExercises: 'Bugünün Egzersizleri',
      progressChartTitle: 'İlerleme Grafiği',
      noWorkoutData: 'Henüz antrenman verisi yok',
      recommended: 'Önerilen',
      timed: 'Süreli',
      reps: 'Tekrarlı',
      begin: 'Başla',
      seconds: 'saniye',
      repsUnit: 'tekrar'
    },
    workoutScreen: {
      initialFeedback: 'Kameranın karşısında dur ve başlat butonuna bas!',
      aiReady: 'AI hazır! Şimdi başlayabilirsin',
      aiFailed: 'AI başlatılamadı, simülasyon modunda devam ediliyor',
      secondsKeepItUp: '{n} saniye! Böyle devam et!',
      cameraReady: 'Kamera hazır! Başlamak için butona bas',
      cameraDenied: 'Kamera erişimi reddedildi',
      started: 'Başladı! Formuna dikkat et',
      resetMessage: 'Sıfırlandı! Hazır olduğunda başla!',
      repAgainAmazing: '{count} tekrar daha! Harika!',
      cameraStarting: 'Kameran başlatılıyor...',
      debugMode: 'Debug modu',
      guide: 'Rehber',
      hideGuide: 'Rehberi gizle',
      showGuide: 'Rehberi göster',
      cameraActive: 'Kamera aktif',
      connecting: 'Bağlanıyor...',
      pause: 'Duraklat',
      start: 'Başla',
      reset: 'Sıfırla',
      finishSave: 'Bitir ve Kaydet',
      motivational: ['Harika!', 'Süper!', 'Devam et!', 'Mükemmel form!', 'Aferin!']
    }
  }
};
