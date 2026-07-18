'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { useI18n } from './I18nProvider';

interface TrendingItem {
  id: number;
  title: string;
  title_en?: string;
  summary?: string;
  summary_en?: string;
  image_url?: string;
  category?: string;
}

export default function TrendingArticlesBar({ currentNewsId }: { currentNewsId?: number }) {
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news?limit=4&sort=trending')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.news) {
          const filtered = currentNewsId
            ? data.news.filter((item: TrendingItem) => item.id !== currentNewsId).slice(0, 3)
            : data.news.slice(0, 3);
          setTrending(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentNewsId]);

  if (loading || trending.length === 0) return null;

  return (
    <div className="my-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-500/10 via-black to-blue-500/10 border-2 border-orange-500/30 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black shadow-lg shadow-orange-500/30 shrink-0">
            <TrendingUp size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-0.5">
              {isEn ? 'Autonomous LinkedIn & Search Loop' : 'موتور خودکار افزایش بازدید و لینک‌سازی لینکدین'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {isEn ? '🔥 Top Trending Articles Right Now' : '🔥 داغ‌ترین مقالات روز (انتخاب مدیران IT و مخاطبین لینکدین)'}
            </h3>
          </div>
        </div>
        <Link
          href="/news"
          className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition shrink-0 self-end sm:self-auto"
        >
          <span>{isEn ? 'View All News' : 'مشاهده آرشیو اخبار'}</span>
          <ArrowRight size={14} className={isEn ? '' : 'rotate-180'} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {trending.map((item) => {
          const itemTitle = isEn ? (item.title_en || item.title) : item.title;
          const itemImage = item.image_url || '/images/og-image.jpg';
          return (
            <Link
              key={item.id}
              href={`/news/${item.id}?source=internal_trending`}
              className="group bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-orange-500/50 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10"
            >
              <div>
                <div className="w-full h-36 rounded-xl overflow-hidden mb-3.5 relative bg-zinc-800">
                  <img
                    src={itemImage}
                    alt={itemTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md text-orange-400 border border-orange-500/40 text-[10px] font-black px-2.5 py-1 rounded-lg">
                    {isEn ? (item.category === 'رمزارز و بلاکچین' ? 'Crypto' : item.category === 'هوش مصنوعی' ? 'AI News' : 'Tech') : (item.category || 'فناوری')}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-orange-400 transition line-clamp-2 leading-snug mb-2">
                  {itemTitle}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 pt-2 border-t border-white/5">
                <span className="text-amber-400/90 flex items-center gap-1">
                  <Sparkles size={12} /> {isEn ? 'AI Analysis' : 'تحلیل اختصاصی'}
                </span>
                <span className="group-hover:translate-x-1 transition flex items-center gap-1 text-white">
                  {isEn ? 'Read More' : 'مطالعه'} ➔
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
