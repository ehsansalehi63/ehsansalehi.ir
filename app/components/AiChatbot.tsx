'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, CornerDownLeft } from 'lucide-react';
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
        ? 'Hello and welcome! 🚀😎 I am Ehsan Salehi\'s cute & smart 3D AI assistant! How can I help you? Want to hear about Ehsan\'s 20 years of IT experience or request a project consultation? 🍕'
        : 'سلام و درود! 🚀😎 من آدمک و دستیار هوشمند بامزه مهندس احسان صالحی هستم! چه کمکی از دست من برمیاد؟ می‌خوای درباره ۲۰ سال تجربه احسان برات بگم یا دنبال سفارش پروژه و مشاوره هستی؟ 🍕'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: isEn 
          ? 'Hello and welcome! 🚀😎 I am Ehsan Salehi\'s cute & smart 3D AI assistant! How can I help you? Want to hear about Ehsan\'s 20 years of IT experience or request a project consultation? 🍕'
          : 'سلام و درود! 🚀😎 من آدمک و دستیار هوشمند بامزه مهندس احسان صالحی هستم! چه کمکی از دست من برمیاد؟ می‌خوای درباره ۲۰ سال تجربه احسان برات بگم یا دنبال سفارش پروژه و مشاوره هستی؟ 🍕'
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
    }
  };

  return (
    <div className={`fixed bottom-6 ${isEn ? 'right-6' : 'left-6'} z-50 font-vazir`} dir={isEn ? 'ltr' : 'rtl'}>
      {/* 3D-Like Cute Robotic Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3.5 px-5 py-4 rounded-[28px] bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500 text-black font-extrabold shadow-[0_15px_35px_rgba(255,107,0,0.45)] hover:scale-110 hover:-translate-y-1.5 transition-all duration-300 border-2 border-white/40 animate-bounce"
          aria-label={isEn ? 'Open AI Smart Assistant' : 'باز کردن چت‌بات هوشمند'}
        >
          {/* 3D Cute Robot Icon Container */}
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-zinc-900 via-[#1e2336] to-black border-2 border-orange-400/80 shadow-[inset_0_4px_10px_rgba(255,255,255,0.3)] flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <span className="text-2xl filter drop-shadow-[0_4px_8px_rgba(255,165,0,0.8)] animate-pulse">🤖</span>
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-black animate-ping" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-black tracking-wider uppercase text-black/80">{isEn ? 'AI Assistant' : 'رفیق هوشمند شما'}</span>
            <span className="text-sm font-extrabold text-black drop-shadow-sm">{isEn ? 'Talk with Ehsan AI 🚀' : 'چت با آدمک هوشمند 🚀'}</span>
          </div>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] md:w-[430px] h-[560px] max-h-[85vh] rounded-[32px] bg-[#10121a]/95 backdrop-blur-2xl border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* 3D Cute Robot Header */}
          <div className="bg-gradient-to-r from-orange-600/40 via-[#181b26] to-blue-600/40 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-300 to-blue-500 border-2 border-white/30 shadow-[0_6px_16px_rgba(255,107,0,0.35)] flex items-center justify-center text-2xl filter drop-shadow transform -rotate-6 animate-pulse">
                🤖
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  {isEn ? 'Ehsan AI Cute 3D Assistant' : 'آدمک و دستیار بامزه احسان'} <Sparkles size={14} className="text-amber-400 animate-pulse" />
                </h4>
                <p className="text-[11px] text-zinc-300 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" /> {isEn ? 'Online & Ready to Help' : 'آنلاین و آماده گفتگو با شما'}
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
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-blue-500/20 border border-orange-500/30 flex items-center justify-center text-lg shrink-0 shadow-sm">
                    🤖
                  </div>
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
                <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-lg shrink-0">
                  🤖
                </div>
                <div className="bg-white/10 text-zinc-300 rounded-2xl rounded-tr-none px-4 py-3.5 text-xs border border-white/10 flex items-center gap-2 font-medium">
                  <span>{isEn ? 'Thinking and typing response...' : 'آدمک در حال فکر کردن و نوشتن...'}</span>
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
