'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  summary: string;
  image_url: string;
  video_url?: string;
  source_name: string;
  published_at: string;
}

export default function NewsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    // در صفحه /news همه اخبار را نمایش می‌دهیم (بدون محدودیت)
    fetch('/api/news?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNews(data.news);
          setFilteredNews(data.news);
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
    if (!search.trim()) {
      setFilteredNews(news);
      return;
    }
    const q = search.trim().toLowerCase();
    const filtered = news.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q)
    );
    setFilteredNews(filtered);
  }, [search, news]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const params = new URLSearchParams();
    if (value) params.set('q', value);
    window.history.replaceState(null, '', `/news?${params.toString()}`);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-700 rounded w-1/3 mx-auto"></div>
        <div className="h-10 bg-gray-700 rounded w-full max-w-md mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-72"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-xl">{error}</p>
        <Link href="/" className="text-amber-400 hover:underline mt-4 inline-block">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
          📰 همه اخبار تکنولوژی
        </h1>
        <p className="text-zinc-400 mt-2 text-lg">
          جدیدترین رویدادهای دنیای فناوری
        </p>
        <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm inline-block mt-2">
          ← بازگشت به صفحه اصلی
        </Link>
      </div>

      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="جستجوی اخبار ..."
            className="w-full px-6 py-4 pr-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-zinc-500">🔍</span>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                window.history.replaceState(null, '', '/news');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-zinc-500 text-sm mt-2 text-center">
          {filteredNews.length} خبر یافت شد
        </p>
      </div>

      {filteredNews.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-xl">هیچ خبری با این عبارت یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all duration-300 flex flex-col h-full group">
      <div className="relative h-48 overflow-hidden bg-zinc-800">
        {item.image_url && !imgError && !isPlaceholder ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-amber-500/10 to-blue-500/10">
            📰
          </div>
        )}
        {item.source_name && (
          <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {item.source_name}
          </span>
        )}
        <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          {formatDate(item.published_at)}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-white line-clamp-2 mb-2 group-hover:text-amber-400 transition-colors">
          <Link href={`/news/${item.id}`}>
            {item.title}
          </Link>
        </h3>
        {item.summary && (
          <p className="text-zinc-400 text-sm line-clamp-3 flex-grow mb-3">
            {item.summary}
          </p>
        )}
        <Link
          href={`/news/${item.id}`}
          className="inline-flex items-center text-amber-400 font-medium hover:text-amber-300 transition-colors mt-auto"
        >
          ادامه مطلب
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
