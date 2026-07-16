'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Clock } from 'lucide-react';
import { useI18n } from './I18nProvider';

interface NewsItem {
  id: number;
  title: string;
  title_en?: string;
  summary: string;
  summary_en?: string;
  image_url: string;
  source_name: string;
  published_at: string;
  category?: string;
}

function getOrDetectCategory(item: NewsItem, isEn: boolean): string {
  let cat = item.category || '';
  if (!cat) {
    const text = ((item.title_en || item.title) + ' ' + (item.summary_en || item.summary || '') + ' ' + (item.source_name || '')).toLowerCase();
    if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('coin') || text.includes('token') || text.includes('solana') || text.includes('binance') || text.includes('بیت کوین') || text.includes('رمز ارز') || text.includes('ارز دیجیتال') || text.includes('بلاکچین') || text.includes('coindesk')) {
      cat = 'رمزارز و بلاکچین';
    } else if (text.includes('ai ') || text.includes('chatgpt') || text.includes('openai') || text.includes('llm') || text.includes('gemini') || text.includes('claude') || text.includes('هوش مصنوعی') || text.includes('یادگیری ماشین')) {
      cat = 'هوش مصنوعی';
    } else if (text.includes('security') || text.includes('cyber') || text.includes('hack') || text.includes('malware') || text.includes('امنیت') || text.includes('هک') || text.includes('سایبری')) {
      cat = 'امنیت سایبری';
    } else if (text.includes('apple') || text.includes('samsung') || text.includes('phone') || text.includes('android') || text.includes('gpu') || text.includes('cpu') || text.includes('intel') || text.includes('nvidia') || text.includes('اپل') || text.includes('سامسونگ') || text.includes('موبایل') || text.includes('سخت افزار')) {
      cat = 'سخت‌افزار و گجت';
    } else {
      cat = 'فناوری و رمزارز';
    }
  }

  if (isEn) {
    if (cat === 'رمزارز و بلاکچین') return 'Crypto & Blockchain 🪙';
    if (cat === 'هوش مصنوعی') return 'Artificial Intelligence 🤖';
    if (cat === 'امنیت سایبری') return 'Cyber Security 🔒';
    if (cat === 'سخت‌افزار و گجت') return 'Hardware & Gadgets 📱';
    if (cat === 'فناوری و رمزارز') return 'Tech & Crypto News 💻';
    return 'IT & Tech News';
  }
  return cat;
}

export default function NewsSection() {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayCount, setDisplayCount] = useState(6);
  const increment = 6;

  useEffect(() => {
    fetch('/api/news?limit=20')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNews(data.news || []);
        } else {
          setError(isEn ? 'Error fetching latest news' : 'خطا در دریافت اخبار');
        }
        setLoading(false);
      })
      .catch(() => {
        setError(isEn ? 'Server connection error' : 'خطا در ارتباط با سرور');
        setLoading(false);
      });
  }, [isEn]);

  const loadMore = () => setDisplayCount(prev => prev + increment);
  const visibleNews = news.slice(0, displayCount);
  const hasMore = visibleNews.length < news.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-96 bg-zinc-800/60 animate-pulse rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-zinc-800/40 animate-pulse rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 py-8 font-bold">{error}</div>;
  }

  if (news.length === 0) {
    return <div className="text-center text-zinc-400 py-8">{isEn ? 'No news articles published yet.' : 'هنوز خبری منتشر نشده است.'}</div>;
  }

  const featured = visibleNews[0];
  const rest = visibleNews.slice(1);

  return (
    <div className="space-y-12" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header section inside Homepage News */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold mb-2">
            <Flame size={14} /> {isEn ? 'AI-Driven Global Breaking News & Analysis' : 'تحلیل هوش مصنوعی از اخبار جهان'}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            {isEn ? 'Breaking' : 'اخبار فوری'} <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">{isEn ? 'Tech & Crypto News' : 'فناوری و رمزارز'}</span>
          </h2>
        </div>
        <Link 
          href="/news" 
          className="btn-outline text-xs flex items-center gap-2 hover:border-orange-500"
        >
          <span>{isEn ? 'View Complete News Portal & Categories' : 'مشاهده پایگاه کامل اخبار و دسته‌بندی‌ها'}</span>
          <ArrowRight className={`w-4 h-4 ${!isEn ? 'rotate-180' : ''}`} />
        </Link>
      </div>

      {/* ====== Featured Card ====== */}
      {featured && (
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161821] to-[#0d0f17] border border-white/10 hover:border-orange-500/40 transition-all duration-500 shadow-2xl">
          <Link href={`/news/${featured.id}`} className="block">
            <div className="relative h-[440px] w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
              
              {featured.image_url && !featured.image_url.includes('placehold') ? (
                <img 
                  src={featured.image_url} 
                  alt={isEn ? (featured.title_en || featured.title) : featured.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-blue-500/20 flex items-center justify-center text-6xl">
                  📰
                </div>
              )}

              <div className="absolute inset-0 flex items-end p-8 md:p-12 z-20">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-black text-xs font-black px-3 py-1 rounded-full shadow-lg">
                      {getOrDetectCategory(featured, isEn)}
                    </span>
                    {featured.source_name && (
                      <span className="bg-black/60 backdrop-blur-md text-white/90 border border-white/10 text-xs font-bold px-3 py-1 rounded-full">
                        {isEn ? 'Source:' : 'منبع:'} {featured.source_name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight group-hover:text-orange-400 transition-colors">
                    {isEn ? (featured.title_en || featured.title) : featured.title}
                  </h3>
                  {(featured.summary || featured.summary_en) && (
                    <p className="text-zinc-300 text-sm md:text-base line-clamp-3 mb-6 font-light leading-relaxed">
                      {isEn ? (featured.summary_en || featured.summary) : featured.summary}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-2 text-amber-400 font-bold text-sm bg-black/50 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 group-hover:bg-amber-500 group-hover:text-black transition-all">
                    {isEn ? 'Read Full Story & AI Analysis' : 'ادامه مطلب و مطالعه تحلیل AI'} <ArrowRight className={`w-4 h-4 ${!isEn ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </div>

              <div className="absolute top-5 left-5 z-30 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10">
                <span className="text-white text-xs font-extrabold flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" /> ehsansalehi.ir
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ====== Rest of News Cards ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rest.map((item) => (
          <NewsCard key={item.id} item={item} isEn={isEn} />
        ))}
      </div>

      {/* ====== Load More Button ====== */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            className="px-8 py-3.5 border border-orange-500/40 bg-orange-500/10 text-orange-400 rounded-full hover:bg-orange-500/20 transition-all text-sm font-bold shadow-lg shadow-orange-500/10"
          >
            {isEn ? 'Load More News ↓' : 'مشاهده اخبار بیشتر ↓'}
          </button>
        </div>
      )}
    </div>
  );
}

function NewsCard({ item, isEn }: { item: NewsItem; isEn: boolean }) {
  const [imgError, setImgError] = useState(false);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return isEn
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isPlaceholder = item.image_url?.includes('placehold');
  const summaryText = isEn ? (item.summary_en || item.summary || '') : (item.summary || '');
  const titleText = isEn ? (item.title_en || item.title) : item.title;
  const readingTime = Math.max(1, Math.ceil(summaryText.length / 300));

  return (
    <div className="group relative rounded-3xl bg-gradient-to-b from-[#161821] to-[#0f1118] border border-white/10 hover:border-orange-500/40 transition-all duration-500 flex flex-col h-full hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
      <Link href={`/news/${item.id}`} className="block relative h-48 overflow-hidden bg-zinc-900">
        {item.image_url && !imgError && !isPlaceholder ? (
          <img
            src={item.image_url}
            alt={titleText}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-orange-500/10 to-blue-500/10">
            📰
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161821] via-transparent to-transparent opacity-90" />

        <span className={`absolute top-3 ${isEn ? 'right-3' : 'left-3'} bg-black/80 backdrop-blur-md text-orange-400 border border-orange-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg`}>
          {getOrDetectCategory(item, isEn)}
        </span>

        {item.source_name && (
          <span className={`absolute bottom-3 ${isEn ? 'left-3' : 'right-3'} bg-white/10 backdrop-blur-md text-white/90 text-[11px] px-2 py-0.5 rounded-md border border-white/10`}>
            {item.source_name}
          </span>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-medium">
          <span>📅 {formatDate(item.published_at)}</span>
          <span className="flex items-center gap-1"><Clock size={11} className="text-amber-400" /> {readingTime} {isEn ? 'Min Read' : 'دقیقه مطالعه'}</span>
        </div>

        <h4 className="text-base font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-orange-400 transition-colors">
          <Link href={`/news/${item.id}`}>
            {titleText}
          </Link>
        </h4>

        {summaryText && (
          <p className="text-zinc-300 text-xs leading-relaxed line-clamp-2 flex-grow mb-4 font-light">
            {summaryText}
          </p>
        )}

        <div className="pt-3 border-t border-white/10 flex items-center justify-between mt-auto">
          <Link
            href={`/news/${item.id}`}
            className="inline-flex items-center gap-1 text-orange-400 font-bold text-xs group-hover:text-amber-300 transition-colors"
          >
            {isEn ? 'Read Full AI Analysis' : 'ادامه مطلب'} <ArrowRight size={13} className={`${!isEn ? 'rotate-180 transform group-hover:-translate-x-1' : 'transform group-hover:translate-x-1'} transition-transform`} />
          </Link>
          <span className="text-[10px] text-zinc-500">ehsansalehi.ir</span>
        </div>
      </div>
    </div>
  );
}
