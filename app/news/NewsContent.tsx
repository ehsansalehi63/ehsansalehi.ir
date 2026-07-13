'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Clock, Search, Filter } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  summary: string;
  image_url: string;
  video_url?: string;
  source_name: string;
  published_at: string;
  category?: string;
}

const CATEGORIES = [
  { id: 'همه', label: '🌟 همه اخبار', color: 'from-orange-500 to-amber-500' },
  { id: 'رمزارز و بلاکچین', label: '🪙 رمزارز و بلاکچین', color: 'from-amber-500 to-yellow-500' },
  { id: 'هوش مصنوعی', label: '🤖 هوش مصنوعی و AI', color: 'from-purple-500 to-pink-500' },
  { id: 'امنیت سایبری', label: '🔒 امنیت سایبری و هک', color: 'from-red-500 to-rose-500' },
  { id: 'سخت‌افزار و گجت', label: '📱 موبایل و سخت‌افزار', color: 'from-blue-500 to-cyan-500' },
  { id: 'فناوری و نرم‌افزار', label: '💻 فناوری اطلاعات', color: 'from-emerald-500 to-green-500' },
];

function getOrDetectCategory(item: NewsItem): string {
  if (item.category && item.category !== '') return item.category;
  const text = (item.title + ' ' + (item.summary || '') + ' ' + (item.source_name || '')).toLowerCase();
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('coin') || text.includes('token') || text.includes('solana') || text.includes('binance') || text.includes('بیت کوین') || text.includes('رمز ارز') || text.includes('ارز دیجیتال') || text.includes('بلاکچین') || text.includes('coindesk')) {
    return 'رمزارز و بلاکچین';
  }
  if (text.includes('ai ') || text.includes('chatgpt') || text.includes('openai') || text.includes('llm') || text.includes('gemini') || text.includes('claude') || text.includes('هوش مصنوعی') || text.includes('یادگیری ماشین')) {
    return 'هوش مصنوعی';
  }
  if (text.includes('security') || text.includes('cyber') || text.includes('hack') || text.includes('malware') || text.includes('امنیت') || text.includes('هک') || text.includes('سایبری')) {
    return 'امنیت سایبری';
  }
  if (text.includes('apple') || text.includes('samsung') || text.includes('phone') || text.includes('android') || text.includes('gpu') || text.includes('cpu') || text.includes('intel') || text.includes('nvidia') || text.includes('اپل') || text.includes('سامسونگ') || text.includes('موبایل') || text.includes('سخت افزار')) {
    return 'سخت‌افزار و گجت';
  }
  return 'فناوری و نرم‌افزار';
}

export default function NewsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'همه';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    fetch('/api/news?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const processed = (data.news || []).map((item: NewsItem) => ({
            ...item,
            category: getOrDetectCategory(item)
          }));
          setNews(processed);
          setFilteredNews(processed);
        } else {
          setError('خطا در دریافت اخبار');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('خطا در ارتباط با سرور');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = news;

    if (selectedCategory !== 'همه') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q)
      );
    }

    setFilteredNews(filtered);
  }, [search, selectedCategory, news]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set('q', value);
    if (selectedCategory !== 'همه') params.set('category', selectedCategory);
    window.history.replaceState(null, '', `/news?${params.toString()}`);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (catId !== 'همه') params.set('category', catId);
    window.history.replaceState(null, '', `/news?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 pt-10">
        <div className="h-14 bg-zinc-800/80 rounded-2xl w-2/3 max-w-lg mx-auto"></div>
        <div className="h-12 bg-zinc-800/60 rounded-2xl w-full max-w-4xl mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-zinc-800/50 rounded-3xl h-80 border border-white/5"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-red-400 text-xl font-bold mb-4">{error}</p>
        <Link href="/" className="btn-primary inline-block">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold mb-4">
          <Flame size={15} className="text-orange-400" /> پوشش لحظه‌ای دنیای فناوری، هوش مصنوعی و بازارهای مالی
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-blue-400 bg-clip-text text-transparent mb-4 tracking-tight">
          پایگاه جامع اخبار و فناوری
        </h1>
        <p className="text-zinc-300 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
          ترجمه روان و خلاصه‌سازی هوشمند داغ‌ترین اخبار رمزارز (Crypto)، هوش مصنوعی (AI)، امنیت سایبری و گجت‌ها توسط دستیار هوش مصنوعی
        </p>
      </div>

      {/* Category Pills Header */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8 max-w-5xl mx-auto">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/25 scale-105'
                  : 'glass text-zinc-300 hover:text-white hover:border-orange-500/30 hover:bg-white/10'
              }`}
            >
              <span>{cat.label}</span>
              {isActive && <span className="w-2 h-2 rounded-full bg-black animate-ping" />}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="relative group">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="جستجو در متن، عنوان یا منبع اخبار ..."
            className="w-full pl-12 pr-14 py-4 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 transition-all shadow-xl group-hover:border-white/20 text-sm md:text-base"
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-orange-400 transition-colors" />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                const params = new URLSearchParams();
                if (selectedCategory !== 'همه') params.set('category', selectedCategory);
                window.history.replaceState(null, '', `/news?${params.toString()}`);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center justify-between text-zinc-400 text-xs mt-3 px-2 font-medium">
          <span>دسته فعال: <strong className="text-amber-400">{selectedCategory}</strong></span>
          <span>تعداد نتایج: <strong className="text-white">{filteredNews.length}</strong> خبر</span>
        </div>
      </div>

      {/* News Grid */}
      {filteredNews.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center max-w-2xl mx-auto border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 text-3xl">
            🧐
          </div>
          <h3 className="text-xl font-bold text-white mb-2">هیچ خبری در این دسته‌بندی یافت نشد</h3>
          <p className="text-zinc-400 text-sm mb-6">عبارت جستجو یا دسته‌بندی انتخابی را تغییر دهید تا نتایج نمایش داده شوند.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('همه');
              window.history.replaceState(null, '', '/news');
            }}
            className="btn-outline text-xs"
          >
            مشاهده همه اخبار
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const [imgError, setImgError] = useState(false);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isPlaceholder = item.image_url?.includes('placehold');
  const readingTime = Math.max(1, Math.ceil(((item.content || item.summary || '').length) / 500));

  return (
    <div className="group relative rounded-3xl bg-gradient-to-b from-[#161821] to-[#0f1118] border border-white/10 hover:border-orange-500/40 transition-all duration-500 flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Top Image Banner */}
      <Link href={`/news/${item.id}`} className="block relative h-56 overflow-hidden bg-zinc-900">
        {item.image_url && !imgError && !isPlaceholder ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-500/20 via-black to-blue-500/20">
            📰
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161821] via-transparent to-transparent opacity-90" />

        {/* Category Badge */}
        <span className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-orange-400 border border-orange-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg">
          {item.category || 'فناوری و رمزارز'}
        </span>

        {/* Source Badge */}
        {item.source_name && (
          <span className="absolute bottom-3 left-4 bg-white/10 backdrop-blur-md text-white/90 text-[11px] px-2.5 py-0.5 rounded-lg border border-white/10">
            {item.source_name}
          </span>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-medium">
          <span>📅 {formatDate(item.published_at)}</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-amber-400" /> {readingTime} دقیقه مطالعه</span>
        </div>

        <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 mb-3 group-hover:text-orange-400 transition-colors">
          <Link href={`/news/${item.id}`}>
            {item.title}
          </Link>
        </h3>

        {item.summary && (
          <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3 flex-grow mb-6 font-light">
            {item.summary}
          </p>
        )}

        <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
          <Link
            href={`/news/${item.id}`}
            className="inline-flex items-center gap-1.5 text-orange-400 font-bold text-xs group-hover:text-amber-300 transition-colors"
          >
            ادامه مطلب و ترجمه کامل
            <ArrowRight size={14} className="rotate-180 transform group-hover:-translate-x-1 transition-transform" />
          </Link>
          <span className="text-[11px] text-zinc-500">✦ هوش مصنوعی</span>
        </div>
      </div>
    </div>
  );
}
