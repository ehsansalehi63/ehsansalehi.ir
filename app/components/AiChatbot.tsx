'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, CornerDownLeft } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'سلام و درود! 🚀😎 من دستیار هوشمند و بامزه مهندس احسان صالحی هستم! چه کمکی از دست من برمیاد؟ می‌خوای درباره ۲۰ سال تجربه احسان برات بگم یا دنبال سفارش پروژه و مشاوره هستی؟ 🍕'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
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
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'متأسفانه در پاسخ‌گویی مشکلی موقتی پیش اومد! 😅 می‌تونی مستقیم به واتساپ یا تلگرام احسان پیام بدی: @ehsansalehi_tech' }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'اتصال شبکه قطع شد! 😅 ولی برای کار فوری حتماً به تلگرام @ehsansalehi_tech پیام بده.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-vazir" dir="rtl">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-blue-600 text-black font-extrabold shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20 animate-bounce"
          aria-label="باز کردن چت‌بات هوشمند"
        >
          <span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white text-lg">
            🤖
          </span>
          <span className="text-sm tracking-wide">دستیار هوشمند احسان</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-ping" />
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] md:w-[420px] h-[550px] max-h-[85vh] rounded-3xl bg-[#10121a]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600/30 via-[#181b26] to-blue-600/30 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black font-black text-xl shadow-md">
                🤖
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  دستیار هوشمند احسان <Sparkles size={13} className="text-amber-400 animate-pulse" />
                </h4>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> آنلاین و پاسخگو
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition"
              aria-label="بستن چت‌بات"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Question Chips */}
          <div className="p-3 bg-black/40 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-[11px] text-zinc-300 hover:text-orange-300 whitespace-nowrap transition shrink-0"
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
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm shrink-0">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-medium rounded-tl-none shadow-md'
                      : 'bg-white/10 text-zinc-200 rounded-tr-none border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm shrink-0">
                    <User size={15} className="text-blue-400" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-center justify-start">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm shrink-0">
                  🤖
                </div>
                <div className="bg-white/10 text-zinc-400 rounded-2xl rounded-tr-none px-4 py-3 text-xs border border-white/5 flex items-center gap-1.5">
                  <span>در حال فکر کردن و نوشتن</span>
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
            className="p-3 bg-black/60 border-t border-white/10 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پیام یا سوالت رو بنویس..."
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-40 text-black font-black flex items-center justify-center transition shadow-lg shrink-0 hover:scale-105"
              aria-label="ارسال پیام"
            >
              <Send size={16} className="transform -rotate-90" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
