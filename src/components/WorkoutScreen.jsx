import React, { useState, useRef, useEffect } from 'react';// React ve gerekli hook'ları import etme
import { Camera, Play, Pause, RotateCcw, Volume2, VolumeX, X, Timer, Hash, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';// Lucide ikonlarını import etme
// Heroicons ikonunu import etme  
import { initPoseDetector, detectPose, drawSkeleton, disposePoseDetector } from '../services/poseDetection';// Pose tespiti için gerekli fonksiyonları import etme
import { analyzeExerciseForm, detectRepCompletion, getDebugAngles } from '../services/exerciseAnalyzer';// Egzersiz formunu analiz etmek ve tekrar tamamlamayı tespit etmek için fonksiyonları import etme
import { calculateCalories, estimateDuration } from '../utils/calorieCalculator';// Kalori hesaplama ve süre tahmini fonksiyonlarını import etme
import { saveWorkoutRecord } from '../services/storageService';// Workout kaydını kaydetmek için fonksiyonu import etme
import WorkoutCompleteModal from './WorkoutCompleteModal';// Antrenman tamamlandığında gösterilecek modal bileşenini import etme
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

// NOT (ÖNEMLİ BİLİNEN EKSİK): analyzeExerciseForm() analizinin döndürdüğü
// analysis.feedback / analysis.speech metinleri (ör. "Lower your hips",
// "Great form!") exerciseAnalyzer.js dosyasından geliyor. O dosya bu
// oturumda paylaşılmadığı için GERÇEK ZAMANLI form geri bildirimi hâlâ
// İngilizce - sadece bu ekranın kendi sabit metinleri (butonlar, durum
// mesajları, motivasyon cümleleri) çevrildi. exerciseAnalyzer.js paylaşılınca
// aynı yöntemle (t() + translations.js'e yeni anahtarlar) tamamlanabilir.
export default function WorkoutScreen({ exercise, userProfile, onExit }) {// WorkoutScreen bileşeni, seçilen egzersiz için kamera ve AI destekli bir antrenman deneyimi sunar. Kullanıcının formunu analiz eder, geri bildirim verir ve antrenman verilerini kaydeder.
  const { t, language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);// Antrenmanın oynatılıp oynatılmadığını kontrol eder
  const [counter, setCounter] = useState(0);// Tekrar sayısını tutar
  const [timer, setTimer] = useState(0);  // Süreli egzersizler için geçen süreyi tutar  
  const [feedback, setFeedback] = useState(() => t('workoutScreen.initialFeedback'));// Kullanıcıya verilen geri bildirim mesajını tutar (ekranda gösterilen TAM metin)
  const [feedbackType, setFeedbackType] = useState('neutral');// Geri bildirim türünü tutar (good, warning, error, neutral)
  const [audioEnabled, setAudioEnabled] = useState(true);// Sesli geri bildirimin açık olup olmadığını kontrol eder
  const [cameraReady, setCameraReady] = useState(false);// Kameranın hazır olup olmadığını kontrol eder
  const [poseDetectorReady, setPoseDetectorReady] = useState(false);// Pose tespit cihazının hazır olup olmadığını kontrol eder
  const [repState, setRepState] = useState({ phase: 'down', angle: 180, lastRepAt: 0 });// Tekrar tespiti için kullanılan durum bilgisi
  const [showCompleteModal, setShowCompleteModal] = useState(false);// Antrenman tamamlandığında modal gösterilip gösterilmeyeceğini kontrol eder
  const [calculatedCalories, setCalculatedCalories] = useState(0);// Antrenman sonunda hesaplanan kalori miktarını tutar
  const [showGuide, setShowGuide] = useState(true);// Rehber videosunun küçük köşe kutusunda gösterilip gösterilmeyeceğini kontrol eder
  const [repPulse, setRepPulse] = useState(false);// Tekrar tamamlandığında sayaçta kısa bir "pulse" animasyonu tetikler
  const [showDebug, setShowDebug] = useState(false);// Kalibrasyon/test amaçlı ham açı değerlerini gösteren debug panelini kontrol eder
  const [debugInfo, setDebugInfo] = useState({});// Debug panelinde gösterilecek anlık açı değerleri
  
  const videoRef = useRef(null);// Video elementine referans tutar
  const canvasRef = useRef(null);// Canvas elementine referans tutar
  const animationFrameRef = useRef(null);// Animasyon karelerini yönetmek için referans tutar
  const lastSpeechTime = useRef(null);

  useEffect(() => {
    let interval;// Süreli egzersizlerde zamanlayıcıyı yönetir
    if (isPlaying && exercise.type === 'timed') {// Eğer antrenman oynatılıyorsa ve süreli bir egzersizse, her saniye timer'ı artırır ve sesli geri bildirim verir
      interval = setInterval(() => {
        setTimer(prev => {
          const newTime = prev + 1;// Zamanı 1 saniye artırır
          if (audioEnabled && newTime % 15 === 0) {// Her 15 saniyede bir motivasyonel mesaj verir
            speakFeedback(t('workoutScreen.secondsKeepItUp', { n: newTime }));
          }
          return newTime;
        });
      }, 1000);// Her 1000 milisaniyede (1 saniye) çalışır
    }
    return () => clearInterval(interval);// Bileşen unmount olduğunda veya isPlaying/exercise.type değiştiğinde zamanlayıcıyı temizler
  }, [isPlaying, exercise.type, audioEnabled]);// isPlaying, exercise.type veya audioEnabled değiştiğinde bu efekti yeniden çalıştırır
  
  useEffect(() => {
    async function setupDetector() {// Pose tespit cihazını başlatır ve hazır olduğunda kullanıcıya geri bildirim verir
      try {
        await initPoseDetector();// Pose tespit cihazını başlatır
        setPoseDetectorReady(true);// Pose tespit cihazının hazır olduğunu işaretler
        setFeedback(t('workoutScreen.aiReady'));
      } catch (error) {
        console.error('AI could not be initialized:', error);
        setFeedback(t('workoutScreen.aiFailed'));
      }
    }
    setupDetector();// Pose tespit cihazını kurar
    return () => {// Bileşen unmount olduğunda pose tespit cihazını temizler
      disposePoseDetector();// Pose tespit cihazını temizler
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {// Antrenman oynatılıyorsa, kamera ve pose tespit cihazı hazırsa, her animasyon karesinde poz tespiti yapar, form analizi gerçekleştirir, geri bildirim verir ve tekrarları sayar
    if (!isPlaying || !cameraReady || !poseDetectorReady || !videoRef.current || !canvasRef.current) {
      return;
    }

    const detectFrame = async () => {// Her animasyon karesinde poz tespiti yapar ve analiz gerçekleştirir
      const poses = await detectPose(videoRef.current);
      
      if (poses && poses.length > 0) {// Poz tespiti başarılıysa, ilk pozun anahtar noktalarını alır, iskeleti çizer, form analizini yapar ve geri bildirim verir
        const keypoints = poses[0].keypoints;// İlk pozun anahtar noktalarını alır
        drawSkeleton(poses, canvasRef.current, videoRef.current);// İskeleti video üzerine çizer
        
        const analysis = analyzeExerciseForm(exercise.id, keypoints, userProfile.fitnessLevel);// Egzersiz formunu analiz eder
        // NOT: analysis.feedback şu an İngilizce (exerciseAnalyzer.js henüz
        // çevrilmedi) - bkz. dosya başındaki not.
        setFeedback(analysis.feedback);// Kullanıcıya geri bildirim mesajını günceller (ekranda gösterilen TAM metin - değişmedi)
        setFeedbackType(analysis.type);// Geri bildirim türünü günceller

        if (showDebug) {// Debug modu açıksa ham açı değerlerini hesaplar
          setDebugInfo(getDebugAngles(exercise.id, keypoints));
        }
        
        if (audioEnabled && (analysis.type === 'error' || analysis.type === 'warning')) {// Eğer sesli geri bildirim açıksa ve analiz sonucu hata veya uyarı ise, sesli geri bildirim verir. Ancak, geri bildirimler arasında en az 5 saniye olmasına dikkat eder
          const now = Date.now();
          if (!lastSpeechTime.current || now - lastSpeechTime.current > 5000) {// Son geri bildirimden bu yana en az 5 saniye geçtiyse, yeni geri bildirim verir
            // KISA sesli versiyon (analysis.speech) kullanılıyor - ekrandaki
            // uzun açıklama (analysis.feedback) hâlâ görsel olarak gösteriliyor,
            // sadece sesli okuma kısaltıldı (kullanıcı geri bildirimi:
            // "İngilizce sesli uyarı çok uzun ve kulak tırmalayıcı"). Bu metin
            // hâlâ İngilizce (exerciseAnalyzer.js'ten geliyor).
            speakFeedback(analysis.speech || analysis.feedback);
            lastSpeechTime.current = now;
          }
        }
        
        if (exercise.type === 'reps') {// Eğer egzersiz saymalı ise, tekrar tamamlanmayı tespit eder ve sayaçları günceller
          const repResult = detectRepCompletion(exercise.id, keypoints, repState, userProfile.fitnessLevel);// Tekrar tamamlanmayı tespit eder
          setRepState(repResult.newState);// Tekrar durumunu günceller
          
          if (repResult.repCompleted && analysis.isCorrect) {// Eğer tekrar tamamlandıysa ve form doğruysa, sayaçları artırır ve motivasyonel mesajlar verir
            const newCount = counter + 1;
            setCounter(newCount);
            setRepPulse(true);// Sayaçta kısa bir pulse animasyonu tetikler
            setTimeout(() => setRepPulse(false), 350);
            
            const motivationalMessages = t('workoutScreen.motivational');
            
            if (audioEnabled) {// Sesli geri bildirim, uyarılarla aynı cooldown'u paylaşır - hızlı art arda speechSynthesis çağrısı sekmeyi dondurabiliyor
              const now = Date.now();
              if (!lastSpeechTime.current || now - lastSpeechTime.current > 600) {
                if (newCount % 5 === 0) {// Her 5 tekrarda özel bir motivasyonel mesaj verir
                  speakFeedback(t('workoutScreen.repAgainAmazing', { count: newCount }));
                } else {
                  const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];// Motivasyonel mesajlar listesinden rastgele bir mesaj seçer
                  speakFeedback(randomMsg);
                }
                lastSpeechTime.current = now;
              }
            }
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(detectFrame);// Bir sonraki animasyon karesi için detectFrame fonksiyonunu çağırır
    };

    detectFrame();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);// Bileşen unmount olduğunda veya bağımlılıklar değiştiğinde animasyon karelerini iptal eder
      }
    };
  }, [isPlaying, cameraReady, poseDetectorReady, exercise.id, exercise.type, repState, audioEnabled, timer, counter, showDebug]);// Antrenman oynatılıyorsa, kamera ve pose tespit cihazı hazırsa, her animasyon karesinde poz tespiti yapar, form analizi gerçekleştirir, geri bildirim verir ve tekrarları sayar

  const speakFeedback = (text) => {
    if (!('speechSynthesis' in window)) return;

    // YENİ: Seçili dile göre (en/tr) konuşma dili ve tercih edilen ses
    // seçiliyor. analysis.speech gibi hâlâ İngilizce kalan metinler için
    // bu doğru olmayabilir (bkz. yukarıdaki not) ama uygulamanın kendi
    // çevrilmiş metinleri (motivasyon mesajları vb.) için doğru telaffuzu sağlıyor.
    const speechLang = language === 'tr' ? 'tr-TR' : 'en-US';

    const doSpeak = () => {
      window.speechSynthesis.resume(); // Bazı tarayıcılarda kuyruk beklenmedik şekilde duraklıyor
      window.speechSynthesis.cancel(); // Mevcut tüm konuşmaları iptal eder
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Bazı tabletlerde/Android tarayıcılarında varsayılan ses seçilmediğinde
      // hiç ses çıkmıyor (hata da vermiyor) - elimizde varsa açıkça seçilen
      // dile uygun bir ses seçiyoruz.
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferred = voices.find(v => v.lang === speechLang) || voices.find(v => v.lang?.startsWith(language));
        if (preferred) utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    };

    // Ses listesi bazı cihazlarda asenkron yükleniyor - sayfa açılır açılmaz
    // konuşmaya çalışırsan liste boş gelip sessizce başarısız olabiliyor.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
      // Bazı tarayıcılarda voiceschanged hiç tetiklenmeyebilir - yine de bir kez dene
      doSpeak();
    } else {
      doSpeak();
    }
  };

  const startCamera = async () => {// Kullanıcının kamerasına erişim isteği gönderir ve video elementine akışı bağlar
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ // Kameraya erişim izni ister
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } // Video akışını ön kameradan alır ve ideal çözünürlüğü 1280x720 olarak ayarlar
      });
      
      if (videoRef.current) {// Video elementine erişim sağlanırsa, video akışını elemente bağlar ve kamera hazır olduğunda kullanıcıya geri bildirim verir
        videoRef.current.srcObject = stream;// Video elementine kamera akışını atar
        videoRef.current.onloadedmetadata = () => {// Video meta verileri yüklendiğinde, kameranın hazır olduğunu işaretler ve kullanıcıya geri bildirim verir
          setCameraReady(true);
          setFeedback(t('workoutScreen.cameraReady'));
        };
      }
    } catch (err) {
      setFeedback(t('workoutScreen.cameraDenied'));
      setFeedbackType('error');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {// Bileşen unmount olduğunda kamera akışını durdurur
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());// Kamera akışındaki tüm parçaları durdurur
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartPause = () => {// Kamera hazır değilse, antrenmanı başlatmaz ve kullanıcıya geri bildirim verir. Aksi takdirde, antrenman durumunu değiştirir ve eğer antrenman başlatılıyorsa, kullanıcıya motivasyonel bir mesaj verir
    if (!cameraReady) return;// Kamera hazır değilse, antrenmanı başlatmaz ve kullanıcıya geri bildirim verir
    setIsPlaying(!isPlaying);// Antrenman durumunu değiştirir
    if (!isPlaying) {// Antrenman başlatılıyorsa, kullanıcıya motivasyonel bir mesaj verir
      setFeedback(t('workoutScreen.started'));
      setFeedbackType('good');
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCounter(0);
    setTimer(0);
    setFeedback(t('workoutScreen.resetMessage'));
    setFeedbackType('neutral');
  };

  const handleFinish = () => {
    setIsPlaying(false);
    const duration = exercise.type === 'timed' ? timer : estimateDuration(exercise.id, counter);
    const calories = calculateCalories(exercise.id, userProfile.weight, duration, counter);
    setCalculatedCalories(calories);
    setShowCompleteModal(true);
  };

  const handleSaveWorkout = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    const workoutData = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: exercise.type,
      duration: exercise.type === 'timed' ? timer : estimateDuration(exercise.id, counter),// Antrenman süresini belirler. Süreli egzersizlerde timer'ı, saymalı egzersizlerde tahmini süreyi kullanır
      reps: exercise.type === 'reps' ? counter : 0,
      calories: calculatedCalories,
      date: new Date().toISOString().split('T')[0]// Antrenman tarihini YYYY-MM-DD formatında kaydeder
    };
    
    await saveWorkoutRecord(workoutData);
    setShowCompleteModal(false);
    onExit();
  };

  const handleExit = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    onExit();
  };

  const colorblindMode = userProfile?.colorblindMode;

  const getFeedbackColor = () => {
    if (colorblindMode) {
      // Kırmızı/yeşil yerine mavi/turuncu - tüm renk körlüğü tiplerinde
      // (Protanopia/Deuteranopia/Tritanopia) birbirinden ayırt edilebilir kalıyor
      switch(feedbackType) {
        case 'good': return 'from-blue-500/30 to-cyan-500/30 border-blue-500/50';
        case 'warning': return 'from-orange-500/30 to-amber-600/30 border-orange-500/50';
        case 'error': return 'from-rose-700/40 to-red-900/40 border-rose-600/60';
        default: return 'from-slate-500/30 to-slate-600/30 border-slate-500/50';
      }
    }
    switch(feedbackType) {
      case 'good': return 'from-green-500/30 to-emerald-500/30 border-green-500/50';
      case 'warning': return 'from-yellow-500/30 to-amber-500/30 border-yellow-500/50';
      case 'error': return 'from-red-500/30 to-rose-500/30 border-red-500/50';
      default: return 'from-cyan-500/30 to-violet-500/30 border-cyan-500/50';
    }
  };

  const getIndicatorColor = () => {
    if (colorblindMode) {
      switch(feedbackType) {
        case 'good': return 'bg-blue-400';
        case 'warning': return 'bg-orange-400';
        case 'error': return 'bg-rose-600';
        default: return 'bg-slate-400';
      }
    }
    switch(feedbackType) {
      case 'good': return 'bg-green-400';
      case 'warning': return 'bg-yellow-400';
      case 'error': return 'bg-red-400';
      default: return 'bg-cyan-400';
    }
  };

  // Renkten bağımsız olarak da ayırt edilebilsin diye her durum için ayrı bir
  // ikon/şekil - bu, renk körlüğü tipinden bağımsız en güvenilir çözüm çünkü
  // hiçbir renk paletine dayanmıyor.
  const getFeedbackIcon = () => {
    switch(feedbackType) {
      case 'good': return <CheckCircle className="w-5 h-5 flex-shrink-0" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
      case 'error': return <XCircle className="w-5 h-5 flex-shrink-0" />;
      default: return <Info className="w-5 h-5 flex-shrink-0" />;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);// Süreyi dakika cinsine çevirir
    const secs = seconds % 60;// Süreyi dakika ve saniye cinsine çevirir
    return `${mins}:${secs.toString().padStart(2, '0')}`;// Süreyi dakika:saniye formatında döndürürür 2 basamaklı saniye göstermek için padStart kullanır
  };

  const getTargetValue = () => {
    return exercise.type === 'timed' ? `${exercise.duration.intermediate}s` : exercise.reps.intermediate;// Hedef değeri belirler. Süreli egzersizlerde orta seviye süreyi, saymalı egzersizlerde orta seviye tekrar sayısını döndürür
  };

  const getProgress = () => {// Hedefe göre ilerleme oranını (0-1 arası) hesaplar, HUD'daki ilerleme halkasında kullanılır
    const target = exercise.type === 'timed' ? exercise.duration.intermediate : exercise.reps.intermediate;
    const current = exercise.type === 'timed' ? timer : counter;
    if (!target) return 0;
    return Math.min(current / target, 1);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col">

      {/* Tam ekran kamera - ana görünüm */}
      <div className="absolute inset-0">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        {cameraReady && isPlaying && (
          <div className="absolute inset-0 pointer-events-none">
            <canvas ref={canvasRef} className="w-full h-full opacity-70 scale-x-[-1]" />
          </div>
        )}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <Camera className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-300 text-lg">{t('workoutScreen.cameraStarting')}</p>
            </div>
          </div>
        )}
        {/* Kamerayı biraz koyulaştırıp üstteki/alttaki metinlerin her zaman okunur kalmasını sağlar */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Üst HUD çubuğu */}
      <div className="relative z-20 flex items-center justify-between gap-2 p-4">
        <button onClick={handleExit} className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-xl leading-none">{exercise.icon}</span>
          {/* NOT: exercise.name henüz çevrilmedi (bkz. Dashboard.jsx'teki not) */}
          <span className="text-white font-bold font-outfit whitespace-nowrap">{exercise.name}</span>
          <span className="w-px h-4 bg-white/20" />
          <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              <circle
                cx="16" cy="16" r="13" fill="none"
                stroke={exercise.type === 'timed' ? '#22d3ee' : '#a78bfa'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={2 * Math.PI * 13 * (1 - getProgress())}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            {exercise.type === 'timed' ? <Timer className="w-4 h-4 text-cyan-400" /> : <Hash className="w-4 h-4 text-violet-400" />}
          </div>
          <span className={`text-white font-black transition-transform duration-300 ${repPulse ? 'scale-125 text-yellow-300' : 'scale-100'}`}>
            {exercise.type === 'timed' ? formatTime(timer) : counter}
          </span>
          <span className="w-px h-4 bg-white/20 hidden sm:block" />
          <span className="text-slate-300 text-xs hidden sm:block whitespace-nowrap">/ {getTargetValue()}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowDebug(!showDebug)} className={`p-3 rounded-full backdrop-blur-md border transition-all ${showDebug ? 'bg-violet-500/80 border-violet-400 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'}`} title={t('workoutScreen.debugMode')}>
            🔧
          </button>
          <button onClick={() => setAudioEnabled(!audioEnabled)} className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all">
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Debug paneli - test/kalibrasyon amaçlı ham açı değerleri */}
      {showDebug && (
        <div className="absolute z-20 top-24 right-4 mt-12 px-4 py-3 rounded-2xl bg-black/70 backdrop-blur-md border border-violet-500/40 font-mono text-xs text-white space-y-1 min-w-[140px]">
          <p className="text-violet-300 font-bold mb-1">DEBUG</p>
          {Object.keys(debugInfo).length === 0 ? (
            <p className="text-slate-400">waiting for pose...</p>
          ) : (
            Object.entries(debugInfo).map(([key, value]) => (
              <p key={key}>{key}: <span className="text-cyan-300 font-bold">{value}</span></p>
            ))
          )}
        </div>
      )}

      {/* Rehber videosu - küçük köşe kutusu (picture-in-picture), tıklayınca gizlenip gösteriliyor */}
      {showGuide ? (
        <div
          onClick={() => setShowGuide(false)}
          role="button"
          tabIndex={0}
          className="absolute z-20 top-24 left-4 w-44 sm:w-64 aspect-square rounded-2xl overflow-hidden border-2 border-violet-500/70 shadow-2xl bg-slate-900 group cursor-pointer"
          title={t('workoutScreen.hideGuide')}>
          <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full bg-violet-500/90 text-xs font-bold text-white">
            {t('workoutScreen.guide')}
          </div>
          <video
            autoPlay loop muted playsInline
            className="w-full h-full object-contain"
            onError={(e) => {
              if (e.target) e.target.style.display = 'none';
              const fallback = e.target.parentElement?.querySelector('.fallback');
              if (fallback) fallback.style.display = 'flex';
            }}>
            <source src={`/guides/${exercise.id}.mp4`} type="video/mp4" />
          </video>
          <div className="fallback hidden absolute inset-0 flex-col items-center justify-center bg-slate-900 p-1">
            <div className="text-5xl">{exercise.icon}</div>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <X className="w-5 h-5 text-white" />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowGuide(true)}
          className="absolute z-20 top-24 left-4 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-semibold hover:bg-black/60 transition-all">
          {t('workoutScreen.showGuide')}
        </button>
      )}

      {/* Kamera durumu göstergesi */}
      <div className="absolute z-20 top-24 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
        <p className="text-white text-xs">{cameraReady ? t('workoutScreen.cameraActive') : t('workoutScreen.connecting')}</p>
      </div>

      {/* Alt kısım: geri bildirim + kontroller */}
      <div className="relative z-20 mt-auto p-4 flex flex-col items-center gap-4">
        <div className={`w-full max-w-2xl p-4 rounded-2xl bg-gradient-to-r ${getFeedbackColor()} backdrop-blur-md border-2 transition-all duration-500`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 flex-shrink-0 rounded-full ${getIndicatorColor()} animate-pulse`}></div>
            <span className="text-white">{getFeedbackIcon()}</span>
            <p className="text-white font-semibold">{feedback}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={handleStartPause} disabled={!cameraReady} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold hover:scale-105 transition-all duration-300 shadow-2xl shadow-violet-500/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            {isPlaying ? <><Pause className="w-5 h-5" /> {t('workoutScreen.pause')}</> : <><Play className="w-5 h-5" /> {t('workoutScreen.start')}</>}
          </button>
          <button onClick={handleReset} className="px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all flex items-center gap-2 font-semibold hover:scale-105">
            <RotateCcw className="w-4 h-4" /> {t('workoutScreen.reset')}
          </button>
          <button onClick={handleFinish} disabled={counter === 0 && timer === 0} className="px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            <CheckCircle className="w-4 h-4" /> {t('workoutScreen.finishSave')}
          </button>
        </div>
      </div>

      {showCompleteModal && (
        <WorkoutCompleteModal exercise={exercise} duration={timer} reps={counter} calories={calculatedCalories} onSave={handleSaveWorkout} onDiscard={() => { setShowCompleteModal(false); onExit(); }} />// Antrenman tamamlandığında gösterilecek modal bileşenini render eder
      )}
    </div>
  );
}
