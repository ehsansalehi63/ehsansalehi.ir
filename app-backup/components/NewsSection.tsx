'use client';

import { useState, useEffect } from 'react';
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

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // فقط ۵ خبر با عکس سالم درخواست می‌شود
    fetch('/api/news?limit=5')
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
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
        <p className="text-gray-500 dark:text-gray-400">هنوز خبری منتشر نشده است.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full border border-gray-100 dark:border-gray-700">
      <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
        {item.image_url && !imgError && !isPlaceholder ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <Link href={`/news/${item.id}`}>
            {item.title}
          </Link>
        </h3>
        {item.summary && (
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 flex-grow mb-3">
            {item.summary}
          </p>
        )}
        <Link
          href={`/news/${item.id}`}
          className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors mt-auto"
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
