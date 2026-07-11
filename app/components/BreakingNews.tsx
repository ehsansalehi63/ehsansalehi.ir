'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function BreakingNews() {
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.news.length > 0) {
          setNews(data.news[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !news) return null;

  return (
    <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-y border-orange-500/20 py-2 px-4 text-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">جدید</span>
          <span className="text-zinc-400">🔥</span>
          <Link href={`/news/${news.id}`} className="text-white hover:text-orange-400 transition-colors line-clamp-1 max-w-md">
            {news.title}
          </Link>
        </div>
        <Link href="/news" className="text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 text-xs font-medium whitespace-nowrap">
          همه اخبار <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
