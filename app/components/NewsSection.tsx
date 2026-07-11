'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url: string;
  source_name: string;
  published_at: string;
}

export default function NewsSection() {
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

  const loadMore = () => setDisplayCount(prev => prev + increment);
  const visibleNews = news.slice(0, displayCount);
  const hasMore = visibleNews.length < news.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-96 bg-gray-800 animate-pulse rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-800 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  if (news.length === 0) {
    return <div className="text-center text-zinc-400 py-8">هنوز خبری منتشر نشده است.</div>;
  }

  const featured = visibleNews[0];
  const rest = visibleNews.slice(1);

  return (
    <div className="space-y-10">
      {/* ====== خبر ویژه (بزرگ) ====== */}
      {featured && (
        <div className="group relative overflow-hidden rounded-2xl glass border border-white/10 hover:border-orange-500/40 transition-all duration-500">
          <Link href={`/news/${featured.id}`} className="block">
            <div className="relative h-[420px] w-full">
              {/* لایه شیشه‌ای روی تصویر */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              
              {/* تصویر */}
              {featured.image_url && !featured.image_url.includes('placehold') ? (
                <img 
                  src={featured.image_url} 
                  alt={featured.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-blue-500/20 flex items-center justify-center text-6xl">
                  📰
                </div>
              )}

              {/* محتوای خبر ویژه */}
              <div className="absolute inset-0 flex items-end p-8 z-20">
                <div className="max-w-2xl">
                  {featured.source_name && (
                    <span className="inline-block bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-3">
                      {featured.source_name}
                    </span>
                  )}
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                    {featured.title}
                  </h3>
                  {featured.summary && (
                    <p className="text-zinc-300 text-base md:text-lg line-clamp-3 mb-4">
                      {featured.summary}
                    </p>
                  )}
                  <span className="inline-flex items-center text-orange-400 font-medium hover:text-orange-300 transition-colors">
                    ادامه مطلب <ArrowRight className="w-4 h-4 mr-1" />
                  </span>
                </div>
              </div>

              {/* لوگوی سایت روی تصویر (کاور) */}
              <div className="absolute top-4 left-4 z-30 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-white text-xs font-bold">📰 ehsansalehi.ir</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ====== بقیه اخبار (کارت‌ها) ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      {/* ====== دکمه مشاهده بیشتر ====== */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            className="px-8 py-3 border border-orange-500/30 text-orange-400 rounded-full hover:bg-orange-500/10 transition-colors text-sm font-medium hover:border-orange-500/60"
          >
            مشاهده بیشتر
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// کامپوننت کارت خبر با کاور شیشه‌ای
// ============================================================
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

  return (
    <div className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/40 transition-all duration-300 hover:scale-[1.02]">
      <Link href={`/news/${item.id}`} className="block">
        <div className="relative h-48 overflow-hidden bg-zinc-800">
          {/* تصویر خبر */}
          {item.image_url && !imgError && !item.image_url.includes('placehold') ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-orange-500/10 to-blue-500/10">
              📰
            </div>
          )}

          {/* برچسب منبع */}
          {item.source_name && (
            <span className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              {item.source_name}
            </span>
          )}

          {/* تاریخ */}
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {formatDate(item.published_at)}
          </span>

          {/* کاور شیشه‌ای (حاشیه و برندینگ) */}
          <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] text-white/70 border border-white/5">
            ehsansalehi.ir
          </div>
        </div>

        {/* عنوان و خلاصه */}
        <div className="p-4">
          <h4 className="text-lg font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
            {item.title}
          </h4>
          {item.summary && (
            <p className="text-zinc-400 text-sm line-clamp-2 mt-1">
              {item.summary}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
