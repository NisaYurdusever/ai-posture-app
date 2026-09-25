import React, { useState } from 'react'; // React ve useState hook'unu import ettik
import { Activity, LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react'; // Lucide ikonlarını import ettik
import { registerUser, loginUser, loginWithGoogle } from '../services/storageService';// Kayıt ve giriş işlemleri için servis fonksiyonlarını import ettik
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

export default function AuthScreen({ onAuthSuccess }) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);// Giriş mi yoksa kayıt mı yapılacağını belirten state
  const [username, setUsername] = useState('');// Kayıt sırasında görünecek isim (leaderboard vs.)
  const [email, setEmail] = useState('');// Kullanıcının girdiği e-posta
  const [password, setPassword] = useState('');// Kullanıcının girdiği şifre
  const [showPassword, setShowPassword] = useState(false);// Şifrenin açık/kapalı gösterimini kontrol eder
  const [error, setError] = useState('');// Hata mesajını tutan state
  const [loading, setLoading] = useState(false);// İşlem sırasında yükleniyor durumunu tutan state
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => { // Form submit edildiğinde çalışacak fonksiyon
    e.preventDefault();// Formun varsayılan submit davranışını engeller
    setError('');// Önceki hatayı temizler
    setLoading(true);

    try {// Giriş veya kayıt işlemi yapar
      const result = isLogin
        ? await loginUser(email, password)
        : await registerUser(username, email, password);

      if (result.success) {// İşlem başarılıysa onAuthSuccess callback'ini çağırır
        onAuthSuccess();
      } else {
        setError(result.message);
      }
      //kayıt ve giriş işlemi sırasında oluşabilecek hataları yakalar ve kullanıcıya gösterir
    } catch (err) {
      setError(t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        onAuthSuccess();
      } else if (result.message) {
        setError(result.message);
      }
    } catch (err) {
      setError(t('auth.genericError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Activity className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h1 className="text-4xl font-black text-cyan-300 mb-2 font-outfit">
            {t('auth.title')}
          </h1>
          <p className="text-slate-400">
            {isLogin ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
          </p>
        </div>

        {/* Form */}
        <div className="p-8 rounded-3xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50">
          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3.5 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-6">
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('auth.continueWithGoogle')}
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-700/50"></div>
            <p className="text-slate-500 text-xs">{t('auth.or')}</p>
            <div className="flex-1 h-px bg-slate-700/50"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kayıt sırasında görünen isim */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">
                  {t('auth.displayName')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-900/80 text-white border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                  placeholder={t('auth.displayNamePlaceholder')}
                  required
                  minLength={3}
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-900/80 text-white border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 rounded-xl bg-slate-900/80 text-white border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-lg hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.processing')}
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {isLogin ? t('auth.signIn') : t('auth.signUp')}
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setUsername('');
                setEmail('');
                setPassword('');
              }}
              className="text-cyan-400 text-cyan-300 transition-colors">
              {isLogin ? (
                <>
                  {t('auth.noAccount')} <span className="font-semibold">{t('auth.signUp')}</span>
                </>
              ) : (
                <>
                  {t('auth.hasAccount')} <span className="font-semibold">{t('auth.signIn')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-slate-800/40">
            <p className="text-cyan-400 text-2xl mb-1">🤖</p>
            <p className="text-slate-300 text-xs">{t('auth.features.aiSupport')}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40">
            <p className="text-violet-400 text-2xl mb-1">📊</p>
            <p className="text-slate-300 text-xs">{t('auth.features.progressTracking')}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40">
            <p className="text-fuchsia-400 text-2xl mb-1">🏆</p>
            <p className="text-slate-300 text-xs">{t('auth.features.personalizedProgram')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
