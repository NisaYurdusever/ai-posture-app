import React, { useState } from 'react';
import { User, Save, ArrowLeft, Calendar, Trash2, AlertTriangle, Globe } from 'lucide-react';
import { loadUserProfile, updateUserProfile, deleteAccount } from '../services/storageService';
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği
import LanguageSwitcher from './LanguageSwitcher';

export default function Settings({ userProfile, onBack, onProfileUpdate, onAccountDeleted }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    gender: userProfile.gender,
    age: userProfile.age || '',
    height: userProfile.height,
    weight: userProfile.weight,
    cycleDay: userProfile.cycleDay || 1,
    targetMuscles: userProfile.targetMuscles || [],
    fitnessLevel: userProfile.fitnessLevel || 'beginner',
    colorblindMode: userProfile.colorblindMode || false
  });
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // NOT: VERİ DEĞERLERİ İngilizce kalıyor, sadece etiketler çevriliyor.
  const muscleOptions = ['Legs', 'Arms', 'Chest', 'Abs', 'Back', 'Shoulders', 'Hips', 'Full Body'];
  const fitnessLevels = ['beginner', 'intermediate', 'advanced'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMuscleToggle = (muscle) => {
    setFormData(prev => {
      const muscles = prev.targetMuscles.includes(muscle)
        ? prev.targetMuscles.filter(m => m !== muscle)
        : [...prev.targetMuscles, muscle];
      return { ...prev, targetMuscles: muscles };
    });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    const result = await deleteAccount();
    if (result.success) {
      if (onAccountDeleted) onAccountDeleted();
    } else {
      setDeleteError(result.message);
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    // Validasyon
    if (!formData.gender || !formData.age || !formData.height || !formData.weight) {
      setMessage(t('settings.fillAllFields'));
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (formData.targetMuscles.length === 0) {
      setMessage(t('settings.selectMuscle'));
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Kaydet
    const updates = {
      gender: formData.gender,
      age: parseInt(formData.age),
      height: parseInt(formData.height),
      weight: parseInt(formData.weight),
      cycleDay: formData.gender === 'Female' ? parseInt(formData.cycleDay) : null,
      targetMuscles: formData.targetMuscles,
      fitnessLevel: formData.fitnessLevel,
      colorblindMode: formData.colorblindMode
    };

    await updateUserProfile(updates);
    setMessage(t('settings.saved'));
    setMessageType('success');
    
    // Profili güncelle
    if (onProfileUpdate) {
      const updatedProfile = await loadUserProfile();
      onProfileUpdate(updatedProfile);
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-all">
            <ArrowLeft className="w-5 h-5" />
            {t('settings.back')}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-cyan-300 font-outfit">{t('settings.title')}</h1>
              <p className="text-slate-400">{t('settings.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            messageType === 'success' 
              ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">

          {/* YENİ: Dil seçimi */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-cyan-400" />
                <label className="text-slate-300 font-semibold">{t('settings.language')}</label>
              </div>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Cinsiyet */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <label className="block text-slate-300 font-semibold mb-3">{t('settings.genderLabel')}</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, gender: 'Male' }))}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  formData.gender === 'Male'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}>
                {t('settings.male')}
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, gender: 'Female' }))}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  formData.gender === 'Female'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}>
                {t('settings.female')}
              </button>
            </div>
          </div>

          {/* Yaş & Boy & Kilo */}
          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <label className="block text-slate-300 font-semibold mb-3">{t('settings.ageLabel')}</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="10"
                max="100"
                className="w-full p-3 rounded-xl bg-slate-900/80 text-white border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
              />
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <label className="block text-slate-300 font-semibold mb-3">{t('settings.heightLabel')}</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                min="100"
                max="250"
                className="w-full p-3 rounded-xl bg-slate-900/80 text-white border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
              />
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <label className="block text-slate-300 font-semibold mb-3">{t('settings.weightLabel')}</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                min="30"
                max="200"
                className="w-full p-3 rounded-xl bg-slate-900/80 text-white border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
              />
            </div>
          </div>
          {/* NOT: Yaş alanı su tüketimi hedefi (WaterTracker) için eklendi -
              zaten profili tamamlamış hesaplar Profile Setup'ı bir daha
              görmeyeceği için bu alan buraya da eklendi. */}

          {/* Döngü Günü (Sadece Kadınlar) */}
          {formData.gender === 'Female' && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-950/50 to-purple-950/50 border border-pink-700/30">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-pink-400" />
                <label className="text-slate-300 font-semibold">{t('settings.cycleTitle')}</label>
              </div>
              <input
                type="number"
                name="cycleDay"
                value={formData.cycleDay}
                onChange={handleInputChange}
                min="1"
                max="28"
                className="w-full p-3 rounded-xl bg-slate-900/80 text-white border border-pink-700/50 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 outline-none"
              />
              <p className="text-slate-400 text-xs mt-2">{t('settings.cycleNote')}</p>
            </div>
          )}

          {/* Fitness Seviyesi */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <label className="block text-slate-300 font-semibold mb-1">{t('settings.fitnessTitle')}</label>
            <p className="text-xs text-slate-500 mb-3">{t('settings.fitnessHint')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fitnessLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setFormData(prev => ({ ...prev, fitnessLevel: level }))}
                  className={`p-3 rounded-xl font-semibold transition-all text-sm ${
                    formData.fitnessLevel === level
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}>
                  {t(`common.fitnessLevels.${level}.label`)}
                </button>
              ))}
            </div>
          </div>

          {/* Renk Körü Dostu Mod */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t('settings.colorblindTitle')}</label>
                <p className="text-xs text-slate-500">{t('settings.colorblindDesc')}</p>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, colorblindMode: !prev.colorblindMode }))}
                className={`relative w-14 h-8 rounded-full transition-all flex-shrink-0 ml-4 ${
                  formData.colorblindMode ? 'bg-gradient-to-r from-cyan-500 to-violet-600' : 'bg-slate-700'
                }`}>
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                  formData.colorblindMode ? 'left-7' : 'left-1'
                }`}></div>
              </button>
            </div>
          </div>

          {/* Hedef Kaslar */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <label className="block text-slate-300 font-semibold mb-4">{t('settings.targetMusclesTitle')}</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {muscleOptions.map(muscle => (
                <button
                  key={muscle}
                  onClick={() => handleMuscleToggle(muscle)}
                  className={`p-3 rounded-xl font-semibold transition-all ${
                    formData.targetMuscles.includes(muscle)
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}>
                  {t(`common.muscles.${muscle}`)}
                </button>
              ))}
            </div>
            <p className="text-slate-400 text-xs mt-3">
              {t('settings.selected')} {formData.targetMuscles.length > 0
                ? formData.targetMuscles.map(m => t(`common.muscles.${m}`)).join(', ')
                : t('settings.notSelected')}
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full p-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:scale-[1.02] transition-all shadow-2xl shadow-green-500/30 flex items-center justify-center gap-3">
            <Save className="w-6 h-6" />
            {t('settings.saveChanges')}
          </button>

          {/* Danger Zone - Hesap Silme */}
          <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 mt-8">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-red-300 font-bold text-lg">{t('settings.dangerZoneTitle')}</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {t('settings.dangerZoneDesc')}
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-5 py-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 font-semibold hover:bg-red-900/50 transition-all flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {t('settings.deleteAccount')}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-red-300 font-semibold">{t('settings.confirmDelete')}</p>
                {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-5 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2">
                    {deleting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {t('settings.confirmDeleteYes')}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                    disabled={deleting}
                    className="px-5 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-semibold hover:bg-slate-700 transition-all">
                    {t('settings.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
