'use client';
import React from 'react';
import { Mail, PhoneCall, Sparkles } from 'lucide-react';

export default function SocialCallout() {
  const socialChannels = [
    {
      name: 'کانال و مشاوره تلگرام',
      desc: 'ارتباط سریع، دریافت آخرین اخبار فناوری و مشاوره فنی',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M21.5 4.5L2.5 11.5L9.5 14.5L12.5 21.5L21.5 4.5Z"/><path d="M9.5 14.5L17.5 6.5"/>
        </svg>
      ),
      url: 'https://t.me/ehsansalehi_tech',
      badge: 'پاسخگویی فوری ⚡',
      color: 'from-blue-600/20 to-cyan-500/10 border-blue-500/30 hover:border-blue-400 shadow-blue-500/10',
      btnText: 'شروع گفتگو در تلگرام'
    },
    {
      name: 'پشتیبانی و چت واتساپ',
      desc: 'هماهنگی جلسات، سفارش پروژه و پشتیبانی مستقیم',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      ),
      url: 'https://wa.me/989108308799',
      badge: 'مستقیم و تلفنی 💬',
      color: 'from-green-600/20 to-emerald-500/10 border-green-500/30 hover:border-green-400 shadow-green-500/10',
      btnText: 'ارسال پیام در واتساپ'
    },
    {
      name: 'شبکه تخصصی لینکدین',
      desc: 'بررسی سوابق ۱۶ ساله، شبکه‌سازی حرفه‌ای و مقالات IT',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
        </svg>
      ),
      url: 'https://www.linkedin.com/in/ehsansalehi',
      badge: 'تخصصی و کاری 💼',
      color: 'from-sky-600/20 to-indigo-500/10 border-sky-500/30 hover:border-sky-400 shadow-sky-500/10',
      btnText: 'مشاهده پروفایل لینکدین'
    },
    {
      name: 'مخزن پروژه‌ها در گیت‌هاب',
      desc: 'مشاهده کدهای متن‌باز، معماری نرم‌افزار و ابزارهای توسعه',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      ),
      url: 'https://github.com/ehsansalehi63',
      badge: 'کدها و ابزارها 🛠️',
      color: 'from-amber-600/20 to-orange-500/10 border-amber-500/30 hover:border-amber-400 shadow-amber-500/10',
      btnText: 'مشاهده گیت‌هاب'
    }
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden bg-gradient-to-b from-black via-[#0d0f17] to-black border-y border-white/10" dir="rtl">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-4">
            <Sparkles size={14} /> پل‌های ارتباطی مستقیم و سریع
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-blue-400 bg-clip-text text-transparent">
              با ما در تماس باشید
            </span>
          </h2>
          <p className="text-zinc-300 text-base md:text-lg font-light leading-relaxed">
            برای مشاوره تخصصی شبکه و هوش مصنوعی، طراحی سیستم‌های سازمانی یا دریافت پاسخ سوالات فنی، از طریق کانال‌های زیر به صورت مستقیم در ارتباط باشید.
          </p>
        </div>

        {/* Social Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {socialChannels.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative rounded-3xl p-7 bg-gradient-to-br ${item.color} border backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/10">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                  {item.name}
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10 text-sm font-bold text-white/90 group-hover:text-amber-400 transition-colors">
                <span>{item.btnText}</span>
                <span className="transform group-hover:-translate-x-2 transition-transform text-lg">←</span>
              </div>
            </a>
          ))}
        </div>

        {/* Direct Contact Banner */}
        <div className="glass rounded-3xl p-8 border border-white/15 bg-gradient-to-r from-orange-500/10 via-black to-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-5 text-center md:text-right">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
              <PhoneCall className="w-7 h-7 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1">نیاز به مشاوره فوری یا تماس تلفنی دارید؟</h4>
              <p className="text-zinc-400 text-sm">ارسال ایمیل به <span className="text-amber-400 font-mono">info@ehsansalehi.ir</span> یا تماس در ساعات اداری</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <a
              href="mailto:info@ehsansalehi.ir"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-amber-400" /> ارسال ایمیل رسمی
            </a>
            <a
              href="https://wa.me/989108308799"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-extrabold text-sm transition shadow-lg shadow-green-500/20 flex items-center gap-2"
            >
              پشتیبانی فوری واتساپ 🚀
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
