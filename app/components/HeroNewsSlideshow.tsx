'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroNewsSlideshow() {
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

  if (loading || newsList.length === 0) return null;

  const currentNews = newsList[currentIndex];
  const categoryBadge = currentNews.category || 'فناوری و رمزارز';

  return (
    <div className="mt-6 w-full max-w-[420px] mx-auto glass-dark rounded-3xl p-5 border border-orange-500/30 shadow-[0_10px_35px_rgba(255,107,0,0.12)] transition-all duration-500 hover:border-orange-500/60 font-vazir" dir="rtl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <span className="flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-orange-500 to-amber-400 text-black px-3 py-1 rounded-full shadow-sm">
          <Flame size={14} className="fill-current" /> اسلایدشو اخبار داغ
        </span>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + newsList.length) % newsList.length)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
            aria-label="خبر قبلی"
          >
            <ChevronRight size={14} />
          </button>
          <span className="text-[11px] font-mono text-amber-400 px-1">
            {currentIndex + 1} / {newsList.length}
          </span>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % newsList.length)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
            aria-label="خبر بعدی"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* Slide Body */}
      <Link href={`/news/${currentNews.id}`} className="group block space-y-3">
        <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
          {currentNews.image_url && !currentNews.image_url.includes('placehold') ? (
            <img 
              src={currentNews.image_url} 
              alt={currentNews.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-blue-500/20 flex items-center justify-center text-4xl">
              📰
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
          <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-orange-400 border border-orange-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
            {categoryBadge}
          </span>
          {currentNews.source_name && (
            <span className="absolute bottom-2.5 left-3 bg-white/10 backdrop-blur-md text-white/90 text-[10px] px-2 py-0.5 rounded-md">
              {currentNews.source_name}
            </span>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-orange-400 transition-colors">
            {currentNews.title}
          </h4>
          <p className="text-zinc-400 text-xs line-clamp-2 mt-1.5 font-light leading-relaxed">
            {currentNews.summary}
          </p>
        </div>
      </Link>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
        <Link 
          href={`/news/${currentNews.id}`}
          className="text-xs font-bold text-orange-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
        >
          مطالعه و تحلیل AI <ArrowRight size={13} className="rotate-180" />
        </Link>
        <Link href="/news" className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
          مشاهده تمام اخبار ←
        </Link>
      </div>
    </div>
  );
}
