'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Clock, Search, Filter } from 'lucide-react';
import { useI18n } from '../components/I18nProvider';

interface NewsItem {
  id: number;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  summary: string;
  summary_en?: string;
  image_url: string;
  video_url?: string;
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
    if (cat === 'رمزارز و بلاکچین') return 'Crypto & Blockchain';
    if (cat === 'هوش مصنوعی') return 'Artificial Intelligence';
    if (cat === 'امنیت سایبری') return 'Cyber Security';
    if (cat === 'سخت‌افزار و گجت') return 'Hardware & Gadgets';
    if (cat === 'فناوری و رمزارز') return 'Tech & Crypto News';
    return 'IT & Tech News';
  }
  return cat;
}

export default function NewsContent() {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || (isEn ? 'All' : 'همه');

  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const categories = isEn ? [
    { id: 'All', label: '🌟 All News', raw: 'همه' },
    { id: 'Crypto & Blockchain', label: '🪙 Crypto & Blockchain', raw: 'رمزارز و بلاکچین' },
    { id: 'Artificial Intelligence', label: '🤖 Artificial Intelligence', raw: 'هوش مصنوعی' },
    { id: 'Cyber Security', label: '🔒 Cyber Security', raw: 'امنیت سایبری' },
    { id: 'Hardware & Gadgets', label: '📱 Hardware & Gadgets', raw: 'سخت‌افزار و گجت' },
    { id: 'Tech & Crypto News', label: '💻 IT & Tech News', raw: 'فناوری و رمزارز' },
  ] : [
    { id: 'همه', label: '🌟 همه اخبار', raw: 'همه' },
    { id: 'رمزارز و بلاکچین', label: '🪙 رمزارز و بلاکچین', raw: 'رمزارز و بلاکچین' },
    { id: 'هوش مصنوعی', label: '🤖 هوش مصنوعی و AI', raw: 'هوش مصنوعی' },
    { id: 'امنیت سایبری', label: '🔒 امنیت سایبری و هک', raw: 'امنیت سایبری' },
    { id: 'سخت‌افزار و گجت', label: '📱 موبایل و سخت‌افزار', raw: 'سخت‌افزار و گجت' },
    { id: 'فناوری و رمزارز', label: '💻 فناوری اطلاعات', raw: 'فناوری و رمزارز' },
  ];

  useEffect(() => {
    fetch('/api/news?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const processed = (data.news || []).map((item: NewsItem) => ({
            ...item,
            categoryFormatted: getOrDetectCategory(item, isEn)
          }));
          setNews(processed);
          setFilteredNews(processed);
        } else {
          setError(isEn ? 'Error fetching news' : 'خطا در دریافت اخبار');
        }
        setLoading(false);
      })
      .catch(() => {
        setError(isEn ? 'Server connection error' : 'خطا در ارتباط با سرور');
        setLoading(false);
      });
  }, [isEn]);

  useEffect(() => {
    let filtered = news;

    if (selectedCategory !== 'همه' && selectedCategory !== 'All') {
      filtered = filtered.filter(item => (item as any).categoryFormatted === selectedCategory || item.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(item =>
        (item.title_en || item.title || '').toLowerCase().includes(q) ||
        (item.summary_en || item.summary || '').toLowerCase().includes(q) ||
        (item.content_en || item.content || '').toLowerCase().includes(q)
      );
    }

    setFilteredNews(filtered);
  }, [search, selectedCategory, news]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set('q', value);
    if (selectedCategory !== 'همه' && selectedCategory !== 'All') params.set('category', selectedCategory);
    window.history.replaceState(null, '', `/news?${params.toString()}`);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (catId !== 'همه' && catId !== 'All') params.set('category', catId);
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
          {isEn ? 'Return to Homepage' : 'بازگشت به صفحه اصلی'}
        </Link>
      </div>
    );
  }

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="font-vazir">
      <div className="text-center mb-10 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold mb-4">
          <Flame size={15} className="text-orange-400" /> {isEn ? 'Instant Coverage of Technology, AI & Crypto Markets' : 'پوشش لحظه‌ای دنیای فناوری، هوش مصنوعی و بازارهای مالی'}
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-blue-400 bg-clip-text text-transparent mb-4 tracking-tight">
          {isEn ? 'Technology & Crypto News Portal' : 'پایگاه جامع اخبار و فناوری'}
        </h1>
        <p className="text-zinc-300 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
          {isEn ? 'Live AI translations, executive summaries, and breaking insights from global IT, Crypto, and Cybersecurity sources.' : 'ترجمه روان و خلاصه‌سازی هوشمند داغ‌ترین اخبار رمزارز (Crypto)، هوش مصنوعی (AI)، امنیت سایبری و گجت‌ها توسط دستیار هوش مصنوعی'}
        </p>
      </div>

      {/* Category Pills Header */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8 max-w-5xl mx-auto">
        {categories.map((cat) => {
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
            placeholder={isEn ? 'Search headlines, keywords, or source publishers...' : 'جستجو در متن، عنوان یا منبع اخبار ...'}
            className={`w-full ${isEn ? 'pl-14 pr-12' : 'pl-12 pr-14'} py-4 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 transition-all shadow-xl group-hover:border-white/20 text-sm md:text-base`}
          />
          <Search className={`absolute ${isEn ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-orange-400 transition-colors`} />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                const params = new URLSearchParams();
                if (selectedCategory !== 'همه' && selectedCategory !== 'All') params.set('category', selectedCategory);
                window.history.replaceState(null, '', `/news?${params.toString()}`);
              }}
              className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition`}
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center justify-between text-zinc-400 text-xs mt-3 px-2 font-medium">
          <span>{isEn ? 'Active Category:' : 'دسته فعال:'} <strong className="text-amber-400">{selectedCategory}</strong></span>
          <span>{isEn ? 'Results Found:' : 'تعداد نتایج:'} <strong className="text-white">{filteredNews.length}</strong> {isEn ? 'articles' : 'خبر'}</span>
        </div>
      </div>

      {/* News Grid */}
      {filteredNews.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center max-w-2xl mx-auto border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 text-3xl">
            🧐
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{isEn ? 'No News Found in This Category' : 'هیچ خبری در این دسته‌بندی یافت نشد'}</h3>
          <p className="text-zinc-400 text-sm mb-6">{isEn ? 'Try changing your search term or selecting another category filter.' : 'عبارت جستجو یا دسته‌بندی انتخابی را تغییر دهید تا نتایج نمایش داده شوند.'}</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory(isEn ? 'All' : 'همه');
              window.history.replaceState(null, '', '/news');
            }}
            className="btn-outline text-xs"
          >
            {isEn ? 'View All News' : 'مشاهده همه اخبار'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} isEn={isEn} />
          ))}
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
    <div className="group relative rounded-3xl bg-gradient-to-b from-[#161821] to-[#0f1118] border border-white/10 hover:border-orange-500/40 transition-all duration-500 flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Top Image Banner */}
      <Link href={`/news/${item.id}`} className="block relative h-56 overflow-hidden bg-zinc-900">
        {item.image_url && !imgError && !isPlaceholder ? (
          <img
            src={item.image_url}
            alt={titleText}
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
        <span className={`absolute top-4 ${isEn ? 'left-4' : 'right-4'} bg-black/80 backdrop-blur-md text-orange-400 border border-orange-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg`}>
          {getOrDetectCategory(item, isEn)}
        </span>

        {/* Source Badge */}
        {item.source_name && (
          <span className={`absolute bottom-3 ${isEn ? 'right-4' : 'left-4'} bg-white/10 backdrop-blur-md text-white/90 text-[11px] px-2.5 py-0.5 rounded-lg border border-white/10`}>
            {item.source_name}
          </span>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-medium">
          <span>📅 {formatDate(item.published_at)}</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-amber-400" /> {readingTime} {isEn ? 'Min Read' : 'دقیقه مطالعه'}</span>
        </div>

        <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 mb-3 group-hover:text-orange-400 transition-colors">
          <Link href={`/news/${item.id}`}>
            {titleText}
          </Link>
        </h3>

        {summaryText && (
          <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3 flex-grow mb-6 font-light">
            {summaryText}
          </p>
        )}

        <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
          <Link
            href={`/news/${item.id}`}
            className="inline-flex items-center gap-1.5 text-orange-400 font-bold text-xs group-hover:text-amber-300 transition-colors"
          >
            {isEn ? 'Read Full AI Analysis' : 'ادامه مطلب و ترجمه کامل'}
            <ArrowRight size={14} className={`${!isEn ? 'rotate-180 transform group-hover:-translate-x-1' : 'transform group-hover:translate-x-1'} transition-transform`} />
          </Link>
          <span className="text-[11px] text-zinc-500">ehsansalehi.ir</span>
        </div>
      </div>
    </div>
  );
}
