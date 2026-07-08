import { notFound } from 'next/navigation';
import { pool } from '../../lib/db';
import Link from 'next/link';
import ShareButtons from '../../components/ShareButtons';

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

  const pageUrl = `https://ehsansalehi.ir/news/${id}`;

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

        {/* دکمه‌های اشتراک‌گذاری - Client Component */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <ShareButtons title={news.title} url={pageUrl} />
        </div>
      </article>
    </main>
  );
}
