'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Sparkles, Clock, ChevronLeft, ChevronRight, ShieldCheck, Send, MessageSquare } from 'lucide-react';

export default function HeroProfileNewsCard() {
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
  const categoryBadge = currentNews?.category || 'فناوری و رمزارز';

  return (
    <div className="w-full max-w-lg mx-auto lg:ml-0 bg-gradient-to-b from-[#161924]/95 to-[#0d0f17]/95 backdrop-blur-2xl rounded-[36px] p-6 md:p-7 border border-orange-500/35 shadow-[0_20px_70px_rgba(255,107,0,0.18)] transition-all duration-500 hover:border-orange-500/60 font-vazir relative overflow-hidden group" dir="rtl">
      {/* Background glowing effects */}
      <div className="absolute top-0 right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========== بخش ۱: هدر ترکیبی پروفایل احسان صالحی ========== */}
      <div className="flex items-center gap-4 pb-5 border-b border-white/10 relative z-10">
        <div className="relative w-20 h-20 md:w-22 md:h-22 rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-lg shrink-0">
          <Image
            src="/images/profile.jpg"
            alt="احسان صالحی"
            width={96}
            height={96}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 text-black text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 whitespace-nowrap">
              👑 ۲۰+ سال سابقه درخشان
            </span>
            <span className="bg-white/10 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 whitespace-nowrap">
              <ShieldCheck size={11} className="text-emerald-400" /> معمار IT و امنیت
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-black text-white truncate">
            مهندس احسان صالحی
          </h3>
          <p className="text-zinc-400 text-xs truncate mt-0.5 font-light">
            مشاور فناوری اطلاعات، امنیت شبکه و هوش مصنوعی
          </p>
        </div>
      </div>

      {/* ========== بخش ۲: نوار وضعیت اخبار فوری و اسلایدشو ========== */}
      <div className="pt-4 relative z-10">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-extrabold bg-orange-500/15 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full animate-pulse shadow-sm">
              <Flame size={13} className="fill-current text-orange-400" /> اخبار فوری و داغ AI و رمزارز
            </span>
          </div>

          {newsList.length > 1 && (
            <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setCurrentIndex((prev) => (prev - 1 + newsList.length) % newsList.length)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
                aria-label="خبر قبلی"
              >
                <ChevronRight size={14} />
              </button>
              <span className="text-[11px] font-mono font-bold text-amber-400 px-1">
                {currentIndex + 1}/{newsList.length}
              </span>
              <button 
                onClick={() => setCurrentIndex((prev) => (prev + 1) % newsList.length)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
                aria-label="خبر بعدی"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          )}
        </div>

        {/* محتوای خبر فعلی */}
        {!loading && currentNews ? (
          <Link href={`/news/${currentNews.id}`} className="group/news block space-y-3">
            <div className="relative h-44 md:h-48 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-inner">
              {currentNews.image_url && !currentNews.image_url.includes('placehold') ? (
                <img 
                  src={currentNews.image_url} 
                  alt={currentNews.title} 
                  className="w-full h-full object-cover group-hover/news:scale-110 transition-transform duration-700" 
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500/20 via-black to-blue-500/20 flex items-center justify-center text-4xl">
                  📰
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-95" />
              
              <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-orange-400 border border-orange-500/40 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                {categoryBadge}
              </span>

              {currentNews.source_name && (
                <span className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-md text-white/90 text-[10px] px-2.5 py-0.5 rounded-lg border border-white/10">
                  منبع: {currentNews.source_name}
                </span>
              )}

              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] text-zinc-300 bg-black/60 px-2 py-0.5 rounded-md">
                <Clock size={11} className="text-amber-400" /> ۲ دقیقه مطالعه
              </div>
            </div>

            <div className="px-1">
              <h4 className="text-sm md:text-base font-bold text-white leading-snug line-clamp-2 group-hover/news:text-orange-400 transition-colors">
                {currentNews.title}
              </h4>
              <p className="text-zinc-400 text-xs line-clamp-2 mt-1.5 font-light leading-relaxed">
                {currentNews.summary}
              </p>
            </div>
          </Link>
        ) : (
          <div className="h-64 rounded-2xl bg-zinc-800/40 animate-pulse flex items-center justify-center text-zinc-500 text-xs">
            در حال بارگذاری اخبار داغ...
          </div>
        )}

        {/* نوار پایانی کارت با دکمه‌های سریع */}
        <div className="mt-5 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {currentNews ? (
            <Link 
              href={`/news/${currentNews.id}`}
              className="text-xs font-bold text-orange-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group/btn"
            >
              <span>مطالعه تحلیل هوش مصنوعی خبر</span>
              <ArrowRight size={13} className="rotate-180 transform group-hover/btn:-translate-x-1 transition-transform" />
            </Link>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <a
              href="https://t.me/ehsansalehi_tech"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition text-xs flex items-center gap-1 font-bold"
              aria-label="مشاوره تلگرام"
            >
              <Send size={13} /> تلگرام
            </a>
            <a
              href="https://wa.me/989108308799"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition text-xs flex items-center gap-1 font-bold"
              aria-label="چت واتساپ"
            >
              <MessageSquare size={13} /> واتساپ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
