import { auth, db } from './firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('No user logged in');
  }
  return uid;
}

/**
 * Auth durumu değiştiğinde (giriş/çıkış/sayfa yenileme sonrası oturum
 * geri yüklendiğinde) tetiklenir. App.jsx bunu tek bir yerden dinleyip
 * hangi ekranın gösterileceğine karar veriyor.
 * @param {(username: string|null) => void} callback
 * @returns {() => void} unsubscribe fonksiyonu
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      callback(snap.exists() ? snap.data().username : null);
    } catch (error) {
      console.error('Failed to resolve current user:', error);
      callback(null);
    }
  });
}

/**
 * Yeni kullanıcı kaydet (Sign Up) - gerçek e-posta ile
 */
export async function registerUser(username, email, password) {
  try {
    if (!username || !email || !password) {
      return { success: false, message: 'Name, email and password are required' };
    }
    if (username.length < 3) {
      return { success: false, message: 'Name must be at least 3 characters long' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long' };
    }

    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

    await setDoc(doc(db, 'users', credential.user.uid), {
      username,
      email: email.trim(),
      createdAt: serverTimestamp(),
      totalExercises: 0,
      totalCalories: 0,
      streak: 0,
      weeklyWorkouts: 0,
      lastWorkout: null
    });

    console.log('✅ Kullanıcı kaydedildi:', username);
    return { success: true, message: 'Registration successful!' };
  } catch (error) {
    console.error('❌ Kayıt hatası:', error);
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, message: 'This email is already registered' };
    }
    if (error.code === 'auth/weak-password') {
      return { success: false, message: 'Password is too weak' };
    }
    if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Please enter a valid email address' };
    }
    return { success: false, message: 'Registration failed!' };
  }
}

/**
 * Kullanıcı girişi (Sign In) - gerçek e-posta ile
 */
export async function loginUser(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    console.log('✅ Giriş başarılı:', email);
    return { success: true, message: 'Login successful!' };
  } catch (error) {
    console.error('❌ Giriş hatası:', error);
    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found'
    ) {
      return { success: false, message: 'Incorrect email or password' };
    }
    if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Please enter a valid email address' };
    }
    return { success: false, message: 'An error occurred' };
  }
}

/**
 * Google ile giriş yap. İlk girişse Firestore'da kullanıcı dokümanı oluşturur.
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const uid = result.user.uid;

    const existing = await getDoc(doc(db, 'users', uid));
    if (!existing.exists()) {
      // İlk kez Google ile giriş yapıyor - varsayılan bir kullanıcı adıyla profil oluştur
      const defaultUsername = result.user.displayName || result.user.email?.split('@')[0] || 'user';
      await setDoc(doc(db, 'users', uid), {
        username: defaultUsername,
        email: result.user.email,
        createdAt: serverTimestamp(),
        totalExercises: 0,
        totalCalories: 0,
        streak: 0,
        weeklyWorkouts: 0,
        lastWorkout: null
      });
    }

    return { success: true, message: 'Login successful!' };
  } catch (error) {
    console.error('❌ Google giriş hatası:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, message: '' }; // Kullanıcı pencereyi kapattı, hata göstermeye gerek yok
    }
    return { success: false, message: 'Google sign-in failed' };
  }
}

/**
 * Çıkış yap (Logout)
 */
export async function logoutUser() {
  await signOut(auth);
  console.log('✅ Logged out successfully');
}

/**
 * Hesabı tamamen sil: antrenman geçmişi + kullanıcı dokümanı + Auth hesabı.
 * Firebase güvenlik nedeniyle yakın zamanda giriş yapılmamışsa
 * 'auth/requires-recent-login' hatası verebilir - bu durumda kullanıcıyı
 * çıkış yapıp tekrar giriş yaptıktan sonra denemeye yönlendiriyoruz.
 */
export async function deleteAccount() {
  try {
    const uid = requireUid();

    // Antrenman geçmişini sil
    const workoutsRef = collection(db, 'users', uid, 'workouts');
    const workoutsSnap = await getDocs(workoutsRef);
    await Promise.all(workoutsSnap.docs.map((d) => deleteDoc(d.ref)));

    // Kullanıcı dokümanını sil
    await deleteDoc(doc(db, 'users', uid));

    // Auth hesabını sil
    await deleteUser(auth.currentUser);

    return { success: true, message: 'Account deleted' };
  } catch (error) {
    console.error('❌ Hesap silme hatası:', error);
    if (error.code === 'auth/requires-recent-login') {
      return {
        success: false,
        message: 'For security, please log out and log back in, then try deleting your account again'
      };
    }
    return { success: false, message: 'Failed to delete account' };
  }
}

/**
 * Kullanıcı profilini kaydetme (ilk kurulum)
 */
export async function saveUserProfile(profile) {
  try {
    const uid = requireUid();
    await setDoc(
      doc(db, 'users', uid),
      { ...profile, updatedAt: serverTimestamp() },
      { merge: true }
    );
    console.log('✅ Profile saved:', profile);
    return true;
  } catch (error) {
    console.error('❌ Failed to save profile:', error);
    return false;
  }
}

/**
 * Kullanıcı profilini yükle (username dahil - kayıt sırasında aynı
 * dökümana yazıldığı için tek okumada gelir)
 */
export async function loadUserProfile() {
  try {
    const uid = requireUid();
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;

    const profile = snap.data();

    if (profile.gender === 'Female' && profile.cycleDay) {
      const updated = updateCycleDayIfNeeded(profile);
      if (updated !== profile) {
        await setDoc(doc(db, 'users', uid), updated, { merge: true });
        console.log('✅ Cycle day updated:', updated.cycleDay);
        return updated;
      }
    }

    console.log('✅ Profile loaded:', profile);
    return profile;
  } catch (error) {
    console.error('❌ Failed to load profile:', error);
    return null;
  }
}

function updateCycleDayIfNeeded(profile) {
  const today = new Date().toISOString().split('T')[0];

  let lastUpdate = profile.lastCycleUpdate;
  if (!lastUpdate && profile.createdAt) {
    const createdDate = profile.createdAt.toDate
      ? profile.createdAt.toDate()
      : new Date(profile.createdAt);
    lastUpdate = createdDate.toISOString().split('T')[0];
  }

  if (!lastUpdate) {
    return { ...profile, lastCycleUpdate: today };
  }

  const lastDate = new Date(lastUpdate);
  const currentDate = new Date(today);
  const daysPassed = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

  if (daysPassed > 0) {
    let newCycleDay = (parseInt(profile.cycleDay) + daysPassed) % 28;
    if (newCycleDay === 0) newCycleDay = 28;
    return { ...profile, cycleDay: newCycleDay, lastCycleUpdate: today };
  }

  return profile;
}

/**
 * Kullanıcı profilini güncelle (örn: Settings sayfasından)
 */
export async function updateUserProfile(updates) {
  try {
    const uid = requireUid();
    await setDoc(
      doc(db, 'users', uid),
      { ...updates, lastUpdated: serverTimestamp() },
      { merge: true }
    );
    console.log('✅ Profile updated:', updates);
    return true;
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    return false;
  }
}

async function fetchWorkoutHistory(uid) {
  const workoutsRef = collection(db, 'users', uid, 'workouts');
  const q = query(workoutsRef, orderBy('timestamp', 'desc'), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      timestamp: data.timestamp?.toDate
        ? data.timestamp.toDate().toISOString()
        : new Date().toISOString()
    };
  });
}

function calculateStreakFromHistory(history) {
  if (history.length === 0) return 0;

  const workoutDays = [
    ...new Set(history.map((w) => new Date(w.timestamp).toISOString().split('T')[0]))
  ]
    .sort()
    .reverse();

  if (workoutDays.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (workoutDays[0] !== today && workoutDays[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(workoutDays[0]);
  for (let i = 0; i < workoutDays.length; i++) {
    const workoutDate = new Date(workoutDays[i]);
    const diffDays = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      streak++;
      currentDate = workoutDate;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Antrenman kaydı ekle + özet istatistikleri (leaderboard'un okuduğu
 * totalCalories/totalExercises/streak) güncelle
 */
export async function saveWorkoutRecord(workout) {
  try {
    const uid = requireUid();
    const workoutsRef = collection(db, 'users', uid, 'workouts');
    const docRef = await addDoc(workoutsRef, {
      ...workout,
      timestamp: serverTimestamp()
    });

    const history = await fetchWorkoutHistory(uid);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyWorkouts = history.filter((w) => new Date(w.timestamp) >= weekAgo).length;
    const streak = calculateStreakFromHistory(history);

    const userSnap = await getDoc(doc(db, 'users', uid));
    const prev = userSnap.exists() ? userSnap.data() : {};

    await setDoc(
      doc(db, 'users', uid),
      {
        totalExercises: (prev.totalExercises || 0) + 1,
        totalCalories: (prev.totalCalories || 0) + (workout.calories || 0),
        weeklyWorkouts,
        streak,
        lastWorkout: new Date().toISOString().split('T')[0]
      },
      { merge: true }
    );

    const newRecord = { id: docRef.id, ...workout };
    console.log('✅ Workout saved:', newRecord);
    return newRecord;
  } catch (error) {
    console.error('❌ Failed to save workout:', error);
    return null;
  }
}

/**
 * Antrenman geçmişini yükle
 */
export async function loadWorkoutHistory() {
  try {
    const uid = requireUid();
    return await fetchWorkoutHistory(uid);
  } catch (error) {
    console.error('❌ Failed to load workout history:', error);
    return [];
  }
}

/**
 * Belirli bir tarih aralığındaki antrenmanları getir
 */
export async function getRecentWorkouts(days = 7) {
  const history = await loadWorkoutHistory();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return history.filter((w) => new Date(w.timestamp) >= startDate);
}

/**
 * Özet istatistikleri yükle (Dashboard kartları için)
 */
export async function loadStats() {
  const defaults = { totalExercises: 0, weeklyWorkouts: 0, streak: 0, totalCalories: 0, lastWorkout: null };
  try {
    const uid = requireUid();
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return defaults;
    const data = snap.data();
    return {
      totalExercises: data.totalExercises || 0,
      weeklyWorkouts: data.weeklyWorkouts || 0,
      streak: data.streak || 0,
      totalCalories: data.totalCalories || 0,
      lastWorkout: data.lastWorkout || null
    };
  } catch (error) {
    console.error('❌ Failed to load stats:', error);
    return defaults;
  }
}

/**
 * Egzersiz bazlı istatistikler
 */
export async function getExerciseStats(exerciseId) {
  const history = await loadWorkoutHistory();
  const exerciseHistory = history.filter((w) => w.exerciseId === exerciseId);

  if (exerciseHistory.length === 0) {
    return { count: 0, totalReps: 0, totalTime: 0, bestReps: 0, averageReps: 0, bestTime: 0 };
  }

  const reps = exerciseHistory.filter((w) => w.reps).map((w) => w.reps);
  const times = exerciseHistory.filter((w) => w.duration).map((w) => w.duration);

  return {
    count: exerciseHistory.length,
    totalReps: reps.reduce((sum, r) => sum + r, 0),
    totalTime: times.reduce((sum, t) => sum + t, 0),
    bestReps: reps.length > 0 ? Math.max(...reps) : 0,
    averageReps: reps.length > 0 ? Math.round(reps.reduce((sum, r) => sum + r, 0) / reps.length) : 0,
    bestTime: times.length > 0 ? Math.max(...times) : 0
  };
}

/**
 * Leaderboard için tüm kullanıcıların özet verisini getir
 * @param {'totalCalories'|'totalExercises'|'streak'} sortField
 * @param {number} topN
 */
export async function loadLeaderboard(sortField = 'totalCalories', topN = 50) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy(sortField, 'desc'), limit(topN));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ Failed to load leaderboard:', error);
    return [];
  }
}

/**
 * O haftanın Pazartesi tarihini "YYYY-MM-DD" olarak döndürür - haftalık
 * program tamamlama takibi bu ID'ye göre gruplanıyor, böylece yeni hafta
 * başlayınca (Pazartesi) işaretlenen günler otomatik sıfırlanmış oluyor.
 */
function getWeekId(date = new Date()) {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Pazar, 1 = Pazartesi ...
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Haftalık programda hangi günlerin "tamamlandı" olarak işaretlendiğini
 * yükler. Saklanan hafta ID'si mevcut haftadan farklıysa (yeni hafta
 * başlamışsa) otomatik olarak sıfırlanır.
 * @returns {Promise<{weekId: string, completedDays: string[]}>}
 */
export async function loadProgramProgress() {
  const currentWeekId = getWeekId();
  try {
    const uid = requireUid();
    const snap = await getDoc(doc(db, 'users', uid));
    const stored = snap.exists() ? snap.data().programProgress : null;

    if (!stored || stored.weekId !== currentWeekId) {
      const fresh = { weekId: currentWeekId, completedDays: [] };
      await setDoc(doc(db, 'users', uid), { programProgress: fresh }, { merge: true });
      return fresh;
    }

    return { weekId: stored.weekId, completedDays: stored.completedDays || [] };
  } catch (error) {
    console.error('❌ Failed to load program progress:', error);
    return { weekId: currentWeekId, completedDays: [] };
  }
}

/**
 * YENİ: Günlük su tüketimi takibi. `waterLog` alanı kullanıcı dokümanında
 * { date, consumedML } olarak tutuluyor - gün değişince (date bugünden
 * farklıysa) otomatik sıfırlanıyor. programProgress'teki hafta sıfırlama
 * mantığıyla birebir aynı desen.
 */
function getTodayId() {
  return new Date().toISOString().split('T')[0];
}

export async function loadWaterLog() {
  const today = getTodayId();
  try {
    const uid = requireUid();
    const snap = await getDoc(doc(db, 'users', uid));
    const stored = snap.exists() ? snap.data().waterLog : null;

    if (!stored || stored.date !== today) {
      const fresh = { date: today, consumedML: 0 };
      await setDoc(doc(db, 'users', uid), { waterLog: fresh }, { merge: true });
      return fresh;
    }
    return stored;
  } catch (error) {
    console.error('❌ Failed to load water log:', error);
    return { date: today, consumedML: 0 };
  }
}

/**
 * Bugünün su tüketimine belirli bir miktar (ml) ekler.
 */
export async function addWaterIntake(amountML) {
  try {
    const uid = requireUid();
    const current = await loadWaterLog();
    const updated = { date: current.date, consumedML: Math.max(0, (current.consumedML || 0) + amountML) };
    await setDoc(doc(db, 'users', uid), { waterLog: updated }, { merge: true });
    return updated;
  } catch (error) {
    console.error('❌ Failed to add water intake:', error);
    return null;
  }
}

/**
 * Bir günü tamamlandı/tamamlanmadı olarak işaretler (toggle).
 * @param {string} dayName - Örn. "Monday"
 * @returns {Promise<{weekId: string, completedDays: string[]}|null>}
 */
export async function toggleProgramDay(dayName) {
  try {
    const uid = requireUid();
    const current = await loadProgramProgress();
    const isCompleted = current.completedDays.includes(dayName);
    const updatedDays = isCompleted
      ? current.completedDays.filter((d) => d !== dayName)
      : [...current.completedDays, dayName];

    const updated = { weekId: current.weekId, completedDays: updatedDays };
    await setDoc(doc(db, 'users', uid), { programProgress: updated }, { merge: true });
    return updated;
  } catch (error) {
    console.error('❌ Failed to toggle program day:', error);
    return null;
  }
}