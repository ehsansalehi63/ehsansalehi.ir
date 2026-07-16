'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Sparkles, Clock, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useI18n } from './I18nProvider';

export default function UnifiedHeroCard() {
  const { t, lang } = useI18n();
  const isEn = lang === 'en';
  const isRtl = !isEn;

  const [newsList, setNewsList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.news && data.news.length > 0) {
          setNewsList(data.news);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (newsList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [newsList]);

  const currentNews = newsList[currentIndex] || null;

  // اگر خبر جاری در حالت انگلیسی است ولی title_en ندارد یا فارسی است، درخواست ترجمه آنی بفرستیم
  useEffect(() => {
    if (isEn && currentNews && (!currentNews.title_en || /[آ-ی]/.test(currentNews.title_en))) {
      fetch(`/api/news/translate-item?id=${currentNews.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.title_en) {
            setNewsList(prev => prev.map(item => item.id === currentNews.id ? { ...item, title_en: d.title_en, summary_en: d.summary_en } : item));
          }
        })
        .catch(() => {});
    }
  }, [isEn, currentNews]);

  let categoryBadge = currentNews?.category || (isEn ? 'Tech & Crypto News' : 'فناوری و رمزارز');
  if (isEn) {
    if (categoryBadge === 'رمزارز و بلاکچین') categoryBadge = 'Crypto & Blockchain 🪙';
    else if (categoryBadge === 'هوش مصنوعی') categoryBadge = 'Artificial Intelligence 🤖';
    else if (categoryBadge === 'امنیت سایبری') categoryBadge = 'Cyber Security 🔒';
    else if (categoryBadge === 'سخت‌افزار و گجت') categoryBadge = 'Hardware & Gadgets 📱';
    else if (categoryBadge === 'فناوری و رمزارز') categoryBadge = 'Tech & Crypto News 💻';
    else categoryBadge = 'Global Tech News';
  }

  const socialLinks = [
    { 
      name: isEn ? 'Telegram' : 'تلگرام', 
      url: 'https://t.me/ehsansalehi_tech', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M21.5 4.5L2.5 11.5L9.5 14.5L12.5 21.5L21.5 4.5Z"/><path d="M9.5 14.5L17.5 6.5"/>
        </svg>
      )
    },
    { 
      name: isEn ? 'WhatsApp' : 'واتساپ', 
      url: 'https://wa.me/989108308799', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      )
    },
    { 
      name: isEn ? 'LinkedIn' : 'لینکدین', 
      url: 'https://www.linkedin.com/company/ehsansalehi-ir', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
        </svg>
      )
    },
    { 
      name: isEn ? 'GitHub' : 'گیت‌هاب', 
      url: 'https://github.com/ehsansalehi63', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      )
    },
    { 
      name: isEn ? 'Email' : 'ایمیل', 
      url: 'mailto:info@ehsansalehi.ir', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      )
    },
  ];

  const titleText = isEn 
    ? (currentNews?.title_en || (/[آ-ی]/.test(currentNews?.title || '') ? `Global Breaking Report: ${currentNews?.source_name || 'Tech News'}` : currentNews?.title))
    : currentNews?.title;

  const summaryText = isEn
    ? (currentNews?.summary_en || (/[آ-ی]/.test(currentNews?.summary || '') ? 'Translating full executive summary into English via AI translator right now...' : currentNews?.summary))
    : currentNews?.summary;

  return (
    <div className="w-full max-w-7xl mx-auto bg-gradient-to-b from-[#151824]/95 via-[#0e1017]/95 to-[#0b0c12]/95 backdrop-blur-3xl rounded-[42px] p-6 sm:p-8 md:p-12 border border-orange-500/35 shadow-[0_25px_100px_rgba(255,107,0,0.18)] relative overflow-hidden group font-vazir" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background ambient glowing spheres */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-500/15 rounded-full blur-[130px] pointer-events-none group-hover:bg-orange-500/25 transition-all duration-700" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Grid: 6 columns Right (Ehsan Executive Profile & CTA) | 6 columns Left (Live News Slideshow) */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* ==================== ستون راست: پروفایل اجرایی، تخصص و دکمه‌های اقدام (۶ ستون) ==================== */}
        <div className={`lg:col-span-6 flex flex-col justify-between space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
          
          {/* ردیف عکس پروفایل و عنوان مهندس احسان صالحی */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b border-white/10">
            <div className="relative w-24 h-24 sm:w-26 sm:h-26 rounded-3xl overflow-hidden border-2 border-orange-500/50 shadow-2xl shrink-0 group/img">
              <Image
                src="/images/profile.jpg"
                alt={t.heroName}
                width={110}
                height={110}
                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  {t.heroBadge}
                </span>
                <span className="bg-white/10 text-emerald-300 text-xs px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-400" /> {t.heroRole}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {t.heroName}
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base mt-1 font-light">
                {t.heroSubtitle}
              </p>
            </div>
          </div>

          {/* شعار اصلی و معرفی خدمات */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white/90 leading-snug">
              {t.heroTagline}
            </h2>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
              {t.heroDesc}
            </p>
          </div>

          {/* دکمه‌های اقدام اصلی (CTA) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a href="#services" className="btn-primary flex items-center gap-2 text-sm px-7 py-3.5 shadow-lg shadow-orange-500/20">
              <span>{t.heroCtaPrimary}</span>
              <ArrowRight className={`w-4 h-4 ${!isRtl ? 'rotate-180' : ''}`} />
            </a>
            <Link href="/projects" className="btn-outline text-sm px-6 py-3.5 border-white/20 hover:border-orange-500">
              {t.heroCtaSecondary}
            </Link>
          </div>

          {/* شبکه‌های اجتماعی یکپارچه */}
          <div className="pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3 text-xs text-zinc-400 font-medium">
              <Sparkles size={13} className="text-amber-400" /> {t.heroSocialHeader}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-orange-500/15 border border-white/10 hover:border-orange-500/40 text-zinc-300 hover:text-white transition-all text-xs font-bold shadow-sm"
                  aria-label={link.name}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== ستون چپ: اسلایدشو و پایگاه اخبار داغ AI و رمزارز (۶ ستون) ==================== */}
        <div className="lg:col-span-6 w-full">
          <div className="bg-black/50 backdrop-blur-2xl rounded-3xl p-6 border border-white/15 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
            
            {/* هدر اسلایدشو اخبار */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-black bg-gradient-to-r from-orange-500 to-amber-400 text-black px-3 py-1 rounded-full shadow-md animate-pulse">
                  <Flame size={14} className="fill-current" /> {t.heroLiveNewsTitle}
                </span>
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> {t.heroOnline}
                </span>
              </div>

              {newsList.length > 1 && (
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + newsList.length) % newsList.length)}
                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
                    aria-label="Previous News"
                  >
                    <ChevronRight size={15} className={!isRtl ? 'rotate-180' : ''} />
                  </button>
                  <span className="text-xs font-mono font-bold text-amber-400 px-1">
                    {currentIndex + 1} / {newsList.length}
                  </span>
                  <button 
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % newsList.length)}
                    className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
                    aria-label="Next News"
                  >
                    <ChevronLeft size={15} className={!isRtl ? 'rotate-180' : ''} />
                  </button>
                </div>
              )}
            </div>

            {/* محتوای خبر فعلی */}
            {!loading && currentNews ? (
              <Link href={`/news/${currentNews.id}`} className="group/news block space-y-4">
                <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg">
                  {currentNews.image_url && !currentNews.image_url.includes('placehold') ? (
                    <img 
                      src={currentNews.image_url} 
                      alt={titleText} 
                      className="w-full h-full object-cover group-hover/news:scale-105 transition-transform duration-700" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500/20 via-black to-blue-500/20 flex items-center justify-center text-5xl">
                      📰
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-95" />
                  
                  <span className={`absolute top-3.5 ${isRtl ? 'right-3.5' : 'left-3.5'} bg-black/85 backdrop-blur-md text-orange-400 border border-orange-500/40 text-xs font-extrabold px-3 py-1 rounded-full shadow-lg`}>
                    {categoryBadge}
                  </span>

                  {currentNews.source_name && (
                    <span className={`absolute bottom-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} bg-white/15 backdrop-blur-md text-white/90 text-[11px] px-3 py-0.5 rounded-lg border border-white/10 font-bold`}>
                      {isEn ? 'Source:' : 'منبع:'} {currentNews.source_name}
                    </span>
                  )}

                  <div className={`absolute bottom-3.5 ${isRtl ? 'right-3.5' : 'left-3.5'} flex items-center gap-1.5 text-xs text-zinc-300 bg-black/70 px-2.5 py-1 rounded-lg font-medium`}>
                    <Clock size={13} className="text-amber-400" /> {isEn ? '2 Min Read' : '۲ دقیقه مطالعه'}
                  </div>
                </div>

                <div className="px-1 space-y-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2 group-hover/news:text-orange-400 transition-colors">
                    {titleText}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm line-clamp-3 font-light leading-relaxed">
                    {summaryText}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="h-72 rounded-2xl bg-zinc-800/40 animate-pulse flex items-center justify-center text-zinc-400 text-sm">
                {isEn ? 'Loading latest breaking news...' : 'در حال دریافت آخرین اخبار فوری از سرور...'}
              </div>
            )}

            {/* فوتر باکس اخبار با لینک پایگاه کامل */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              {currentNews ? (
                <Link 
                  href={`/news/${currentNews.id}`}
                  className="text-xs sm:text-sm font-bold text-orange-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group/btn"
                >
                  <span>{t.heroReadAI}</span>
                  <ArrowRight size={15} className={`${isRtl ? 'rotate-180 transform group-hover/btn:-translate-x-1' : 'transform group-hover/btn:translate-x-1'} transition-transform`} />
                </Link>
              ) : <span />}

              <Link 
                href="/news" 
                className="px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition text-xs font-bold flex items-center gap-1"
              >
                <span>{t.heroViewAllNews}</span>
                <ChevronLeft size={14} className={!isRtl ? 'rotate-180' : ''} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
