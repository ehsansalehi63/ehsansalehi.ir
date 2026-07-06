'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faL } from '@fortawesome/free-solid-svg-icons';

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
  readTime?: number;
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNews(data.news);
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`glass rounded-2xl overflow-hidden animate-pulse ${i === 0 ? 'lg:col-span-2' : ''}`}>
            <div className="h-64 bg-gray-700"></div>
            <div className="p-6 space-y-3">
              <div className="h-6 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400">هنوز خبری منتشر نشده است.</p>
      </div>
    );
  }

  // اولین خبر را به‌عنوان خبر اصلی در نظر می‌گیریم
  const mainNews = news[0];
  const restNews = news.slice(1, 5);

  return (
    <div className="space-y-8">
      {/* خبر اصلی (بزرگ) */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all duration-300 group">
        <Link href={`/news/${mainNews.id}`} className="block">
          <div className="relative h-80 lg:h-[420px] overflow-hidden">
            {mainNews.image_url ? (
              <img 
                src={mainNews.image_url} 
                alt={mainNews.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-6xl">
                📰
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 p-6 text-white">
              {mainNews.category && (
                <span className="inline-block bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold mb-3">
                  {mainNews.category}
                </span>
              )}
              <h3 className="text-2xl lg:text-4xl font-bold mb-2 line-clamp-2">
                {mainNews.title}
              </h3>
              <p className="text-zinc-300 text-sm lg:text-base line-clamp-2 mb-3">
                {mainNews.summary}
              </p>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>{mainNews.source_name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(mainNews.published_at), { addSuffix: true })}</span>
                {mainNews.readTime && (
                  <>
                    <span>•</span>
                    <span>{mainNews.readTime} دقیقه مطالعه</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* بقیه اخبار (دو ستونی) */}
      <div className="grid md:grid-cols-2 gap-6">
        {restNews.map((item) => (
          <div key={item.id} className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all duration-300 group flex flex-col">
            <Link href={`/news/${item.id}`} className="block flex-grow">
              <div className="relative h-48 overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl">
                    📰
                  </div>
                )}
                {item.category && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-black text-xs px-3 py-1 rounded-full font-bold">
                    {item.category}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-lg font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-zinc-400 text-sm line-clamp-2 mt-1">
                  {item.summary}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                  <span>{item.source_name}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* دکمه مشاهده همه اخبار */}
      <div className="text-center mt-8">
        <Link 
          href="/news" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-xl hover:shadow-amber-500/30"
        >
          مشاهده همه اخبار
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
