import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { sendMessageToGemini, getSuggestedQuestions, isGeminiConfigured } from '../services/geminiService';
import { getPhaseInfo } from '../utils/cycleCalculator';
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

// NOT: Burada sadece arayüzün ÇERÇEVESİ (başlık, buton, placeholder,
// karşılama mesajı) çevrildi. geminiService.js'teki kural-tabanlı chatbot
// CEVAPLARININ gövdesi hâlâ İngilizce - o dosya bu oturumda paylaşılmadığı
// için ayrı bir iş olarak bırakıldı.
export default function AIChatbot({ userProfile }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const phaseInfo = userProfile.gender === 'Female' && userProfile.cycleDay // Eğer kullanıcı kadınsa ve döngü günü bilgisi varsa, hormonal döngü bilgilerini alır
    ? getPhaseInfo(userProfile.cycleDay) 
    : null;

  const suggestedQuestions = getSuggestedQuestions(userProfile, phaseInfo);// Kullanıcı profiline ve döngü bilgisine göre önerilen soruları alır

  // Mesajları scroll et
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // İlk açılışta karşılama mesajı
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: t('chatbot.welcomeMessage', {
          cycleClause: userProfile.gender === 'Female' ? t('chatbot.welcomeCycleClause') : ''
        }),
        timestamp: new Date()
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (message = inputValue) => {// Kullanıcının mesajını gönderir, API'ye sorar ve yanıtı ekrana basar
    if (!message.trim() || isLoading) return;// Boş mesaj gönderilmesini veya aynı anda birden fazla mesaj gönderilmesini engeller

    // API key kontrolü
    if (!isGeminiConfigured()) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('chatbot.apiKeyMissing'),
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage = {// Kullanıcının mesajını oluşturur
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);// Mesajı ekrana basar
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(message, userProfile, phaseInfo);// API'den yanıt alır
      
      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: t('chatbot.genericError'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {// Önerilen soruya tıklandığında mesaj olarak gönderir
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e) => {// Enter tuşuna basıldığında mesajı gönderir, Shift + Enter ile yeni satır eklenebilir
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 z-50 group">
          <MessageCircle className="w-8 h-8 text-white" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {t('chatbot.tooltip')}
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900/95 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/50 shadow-2xl z-50 flex flex-col overflow-hidden animate-slideUp">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-cyan-500 to-violet-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{t('chatbot.headerTitle')}</h3>
                <p className="text-white/80 text-xs">{t('chatbot.headerSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
                      : 'bg-slate-800/80 text-slate-200'
                  }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-white/60' : 'text-slate-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <p className="text-slate-400 text-sm">{t('chatbot.thinking')}</p>
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {messages.length === 1 && !isLoading && (
              <div className="space-y-2">
                <p className="text-slate-400 text-xs text-center mb-3">{t('chatbot.suggestedQuestions')}</p>
                {suggestedQuestions.slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(question)}
                    className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-left text-slate-300 text-sm transition-all hover:scale-[1.02] border border-slate-700/50">
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-800/60 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatbot.inputPlaceholder')}
                disabled={isLoading}
                className="flex-1 p-3 rounded-xl bg-slate-900/80 text-white border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-2 text-center">
              {t('chatbot.disclaimer')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
