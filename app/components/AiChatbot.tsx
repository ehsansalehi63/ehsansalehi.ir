'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User } from 'lucide-react';
import { useI18n } from './I18nProvider';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatbot() {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: isEn 
        ? 'Hello and welcome! 🚀😎 I am Ehsan Salehi\'s 3D animated humanoid AI character! How can I help you? Want to hear about Ehsan\'s 20 years of IT experience or request a project consultation? 🍕'
        : 'سلام و درود! 🚀😎 من آدمک و دستیار هوشمند ۳بعدی مهندس احسان صالحی هستم! چه کمکی از دست من برمیاد؟ می‌خوای درباره ۲۰ سال تجربه احسان برات بگم یا دنبال سفارش پروژه و مشاوره هستی؟ 🍕'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // چشمک زدن و صحبت کردن تصادفی آدمک ۳ بعدی
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3500);

    const speakInterval = setInterval(() => {
      if (!isOpen) {
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 1200);
      }
    }, 6000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(speakInterval);
    };
  }, [isOpen]);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: isEn 
          ? 'Hello and welcome! 🚀😎 I am Ehsan Salehi\'s 3D animated humanoid AI character! How can I help you? Want to hear about Ehsan\'s 20 years of IT experience or request a project consultation? 🍕'
          : 'سلام و درود! 🚀😎 من آدمک و دستیار هوشمند ۳بعدی مهندس احسان صالحی هستم! چه کمکی از دست من برمیاد؟ می‌خوای درباره ۲۰ سال تجربه احسان برات بگم یا دنبال سفارش پروژه و مشاوره هستی؟ 🍕'
      }
    ]);
  }, [isEn]);

  const quickQuestions = isEn ? [
    'Tell me about Ehsan\'s 20-year background 😎',
    'What are project pricing and rates? 🍕',
    'How does live Crypto & AI news work? 📰',
    'Direct contact & Telegram channels 🚀'
  ] : [
    'درباره سوابق و تجربه احسان بگو 😎',
    'تعرفه و هزینه پروژه‌ها چقدره؟ 🍕',
    'پوشش اخبار رمزارز و AI چطوره؟ 📰',
    'راه‌های ارتباط و تماس مستقیم 🚀'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: messageText.trim() }
    ];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);
    setIsSpeaking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, lang }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: isEn ? 'Sorry, temporary response issue! 😅 Contact Ehsan directly on WhatsApp/Telegram: @ehsansalehi_tech' : 'متأسفانه در پاسخ‌گویی مشکلی موقتی پیش اومد! 😅 می‌تونی مستقیم به واتساپ یا تلگرام احسان پیام بدی: @ehsansalehi_tech' }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: isEn ? 'Network disconnected! 😅 Please reach out via Telegram @ehsansalehi_tech.' : 'اتصال شبکه قطع شد! 😅 ولی برای کار فوری حتماً به تلگرام @ehsansalehi_tech پیام بده.' }
      ]);
    } finally {
      setLoading(false);
      setIsSpeaking(false);
    }
  };

  // کامپوننت سر ۳بعدی آدمک (3D Humanoid Robot Head)
  const RobotAvatar3D = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => {
    const sizeClasses = size === 'lg' ? 'w-14 h-14 rounded-3xl' : 'w-10 h-10 rounded-2xl';
    return (
      <div className={`relative ${sizeClasses} bg-gradient-to-b from-amber-300 via-orange-500 to-amber-700 border-2 border-white/60 shadow-[0_10px_25px_rgba(255,107,0,0.5),inset_0_2px_6px_rgba(255,255,255,0.8)] flex flex-col items-center justify-center shrink-0 overflow-hidden`}>
        {/* نور شیشه‌ای کلاه ایمنی ربات (Visor Glint) */}
        <div className="absolute top-1 left-1.5 right-1.5 h-3 bg-gradient-to-b from-white/70 to-transparent rounded-t-xl pointer-events-none" />
        
        {/* چشم‌های دیجیتالی درخشان آدمک */}
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className={`w-2.5 h-2.5 rounded-full bg-cyan-200 border border-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all duration-150 ${isBlinking ? 'scale-y-10 opacity-20' : 'scale-y-100 opacity-100 animate-pulse'}`} />
          <div className={`w-2.5 h-2.5 rounded-full bg-cyan-200 border border-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all duration-150 ${isBlinking ? 'scale-y-10 opacity-20' : 'scale-y-100 opacity-100 animate-pulse'}`} />
        </div>

        {/* دهان متحرک و هوشمند آدمک هنگام صحبت */}
        <div className="mt-1.5 flex items-center justify-center gap-0.5 h-2">
          {loading || isSpeaking ? (
            <>
              <span className="w-1 bg-white rounded-full h-2 animate-bounce [animation-delay:0.1s]" />
              <span className="w-1.5 bg-white rounded-full h-3 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 bg-white rounded-full h-2 animate-bounce [animation-delay:0.3s]" />
            </>
          ) : (
            <div className="w-5 h-1 bg-white/90 rounded-full shadow-[0_0_5px_#fff]" />
          )}
        </div>

        {/* آنتن روی سر ربات */}
        <div className="absolute -top-1.5 w-2 h-2 rounded-full bg-red-400 border border-white animate-ping" />
      </div>
    );
  };

  return (
    <div className={`fixed bottom-6 ${isEn ? 'right-6' : 'left-6'} z-50 font-vazir`} dir={isEn ? 'ltr' : 'rtl'}>
      {/* Floating 3D Humanoid Toggle Button */}
      {!isOpen && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3.5 px-5 py-3.5 rounded-[32px] bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600 text-black font-extrabold shadow-[0_15px_35px_rgba(255,107,0,0.5)] hover:scale-105 transition-all duration-300 border-2 border-white/50 animate-bounce"
            aria-label={isEn ? 'Open 3D AI Smart Assistant' : 'باز کردن آدمک هوشمند'}
          >
            <RobotAvatar3D size="lg" />
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-black tracking-wider uppercase text-black/80 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-950 inline-block animate-ping" />
                {isEn ? '3D Animated AI' : 'آدمک ۳بعدی متحرک'}
              </span>
              <span className="text-sm font-black text-black drop-shadow-sm">
                {isEn ? 'Talk with Ehsan AI 🚀' : 'چت با آدمک هوشمند 🚀'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] md:w-[430px] h-[560px] max-h-[85vh] rounded-[32px] bg-[#10121a]/95 backdrop-blur-2xl border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header with 3D Robot */}
          <div className="bg-gradient-to-r from-orange-600/40 via-[#181b26] to-blue-600/40 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <RobotAvatar3D size="sm" />
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  {isEn ? 'Ehsan 3D Humanoid Assistant' : 'آدمک و دستیار ۳بعدی احسان'} <Sparkles size={14} className="text-amber-400 animate-pulse" />
                </h4>
                <p className="text-[11px] text-zinc-300 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" /> {isEn ? 'Online & Speaking' : 'آنلاین و آماده گفتگو با شما'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition border border-white/10"
              aria-label="Close Chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Question Chips */}
          <div className="p-3 bg-black/50 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-[11px] text-zinc-200 hover:text-orange-300 whitespace-nowrap transition font-bold shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <RobotAvatar3D size="sm" />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold rounded-tl-none shadow-lg'
                      : 'bg-white/10 text-zinc-100 rounded-tr-none border border-white/10 shadow-md font-light'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm shrink-0">
                    <User size={16} className="text-blue-400" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-center justify-start">
                <RobotAvatar3D size="sm" />
                <div className="bg-white/10 text-zinc-300 rounded-2xl rounded-tr-none px-4 py-3.5 text-xs border border-white/10 flex items-center gap-2 font-medium">
                  <span>{isEn ? '3D Robot is speaking and typing...' : 'آدمک ۳بعدی در حال صحبت و نوشتن...'}</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3.5 bg-black/70 border-t border-white/10 flex items-center gap-2.5 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isEn ? 'Type your message or question...' : 'پیام یا سوالت رو بنویس...'}
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-40 text-black font-black flex items-center justify-center transition shadow-lg shrink-0 hover:scale-105"
              aria-label="Send Message"
            >
              <Send size={18} className={`transform ${isEn ? 'rotate-0' : '-rotate-90'}`} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
