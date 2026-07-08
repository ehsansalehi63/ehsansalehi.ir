import { notFound } from 'next/navigation';
import { pool } from '../../lib/db';
import Link from 'next/link';

interface NewsPageProps {
  params: Promise<{ id: string }>;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getNews(id: string) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM news_posts WHERE id = ?',
      [id]
    );
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('❌ خطا در دریافت خبر:', error);
    return null;
  }
}

export default async function NewsPage({ params }: NewsPageProps) {
  // ✅ در Next.js 16، params باید با await دریافت شود
  const { id } = await params;
  const news = await getNews(id);

  if (!news) {
    notFound();
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
      <article className="max-w-4xl mx-auto" dir="rtl">
        <Link 
          href="/#news" 
          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors mb-8 group text-sm"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت به اخبار
        </Link>

        {news.image_url && !news.image_url.includes('placehold') && (
          <div className="relative w-full h-[420px] rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-amber-500/10">
            <img 
              src={news.image_url} 
              alt={news.title} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 mb-6">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
            {news.source_name || 'منبع ناشناس'}
          </span>
          <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
          <span>{formatDate(news.published_at)}</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          <span className="bg-gradient-to-r from-amber-400 to-blue-400 bg-clip-text text-transparent">
            {news.title}
          </span>
        </h1>

        {news.summary && (
          <div className="text-lg md:text-xl text-zinc-300 leading-relaxed border-r-4 border-amber-500/50 pr-4 mb-8 bg-white/5 p-4 rounded-xl">
            {news.summary}
          </div>
        )}

        {news.video_url && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10">
            <video 
              controls 
              className="w-full aspect-video"
              poster={news.image_url || undefined}
              preload="metadata"
            >
              <source src={news.video_url} type="video/mp4" />
              مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
          </div>
        )}

        <div className="prose prose-lg prose-invert max-w-none">
          {news.content.split('\n').map((paragraph: string, index: number) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={index} className="text-base md:text-lg text-zinc-300 leading-[2.2] mb-5 first:mt-0">
                {paragraph}
              </p>
            );
          })}
        </div>

        {news.source_url && news.source_url !== news.original_url && (
          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            <a 
              href={news.source_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-zinc-500 hover:text-amber-400 transition-colors text-sm"
            >
              🔗 مشاهده خبر در منبع اصلی
            </a>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-white/10 flex items-center gap-4 flex-wrap">
          <span className="text-sm text-zinc-400">اشتراک‌گذاری:</span>
          <button 
            className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-full transition-colors"
            onClick={() => navigator.share?.({ title: news.title, url: window.location.href })}
          >
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
            </svg>
          </button>
          <button 
            className="p-2 bg-sky-500/20 hover:bg-sky-500/40 rounded-full transition-colors"
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(news.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
          >
            <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.9 1 18.58c2.04 1.3 4.46 2.06 7.08 2.06 8.5 0 13.13-7.04 13.13-13.13 0-.2 0-.4-.02-.6.9-.63 1.68-1.42 2.3-2.33z" />
            </svg>
          </button>
          <button 
            className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-full transition-colors"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(news.title + ' ' + window.location.href)}`, '_blank')}
          >
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.44 5.56c-2.43-2.43-5.57-3.36-8.73-2.79-.35.06-.7.15-1.04.25-3.36.98-6.07 3.7-7.04 7.04-.1.34-.19.69-.25 1.04-.57 3.16.36 6.3 2.79 8.73l2.76-2.76c-1.34-1.34-1.86-3.29-1.4-5.13.38-1.57 1.53-2.72 3.1-3.1 1.84-.46 3.79.06 5.13 1.4L20.44 5.56z" />
            </svg>
          </button>
        </div>
      </article>
    </main>
  );
}
