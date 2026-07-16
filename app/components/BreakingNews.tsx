'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import { useI18n } from './I18nProvider';

export default function BreakingNews() {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const [newsList, setNewsList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news?limit=5')
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
    }, 5000);
    return () => clearInterval(interval);
  }, [newsList]);

  if (loading || newsList.length === 0) return null;

  const currentNews = newsList[currentIndex];
  const title = isEn ? (currentNews.title_en || currentNews.title) : currentNews.title;
  
  let categoryBadge = currentNews.category || (isEn ? 'Tech & Crypto' : 'فناوری و رمزارز');
  if (isEn) {
    if (categoryBadge === 'رمزارز و بلاکچین') categoryBadge = 'Crypto & Blockchain';
    else if (categoryBadge === 'هوش مصنوعی') categoryBadge = 'Artificial Intelligence';
    else if (categoryBadge === 'امنیت سایبری') categoryBadge = 'Cyber Security';
    else if (categoryBadge === 'سخت‌افزار و گجت') categoryBadge = 'Hardware & Tech';
    else if (categoryBadge === 'فناوری و رمزارز') categoryBadge = 'Tech & Crypto';
    else categoryBadge = 'IT News';
  }

  return (
    <div className="fixed top-[60px] left-0 right-0 z-40 bg-[#0c0e14]/95 backdrop-blur-md border-b border-orange-500/30 shadow-[0_4px_25px_rgba(255,107,0,0.15)] py-2.5 px-4 text-sm font-vazir transition-all" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm animate-pulse whitespace-nowrap">
            <Flame size={13} className="fill-current" /> {isEn ? 'BREAKING NEWS' : 'خبر فوری'}
          </span>
          <span className="hidden sm:inline-block bg-white/10 text-orange-300 text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap border border-white/5">
            {categoryBadge}
          </span>
          <Link 
            key={currentNews.id} 
            href={`/news/${currentNews.id}`} 
            className="text-zinc-100 hover:text-orange-400 transition-colors font-medium truncate flex-1 block max-w-2xl"
          >
            {title}
          </Link>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            href="/news" 
            className="inline-flex items-center gap-1 text-xs font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30 transition-all shadow-sm whitespace-nowrap"
          >
            <Sparkles size={13} /> {isEn ? 'Tech & Crypto News Portal' : 'پایگاه اخبار فناوری و رمزارز'} <ArrowRight className={`w-3.5 h-3.5 ${!isEn ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>
    </div>
  );
}
