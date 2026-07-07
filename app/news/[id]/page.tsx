import { notFound } from 'next/navigation';
import { pool } from '../../../lib/db';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NewsPageProps {
  params: Promise<{ id: string }>;
}

async function getNews(id: string) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM news_posts WHERE id = ?',
      [id]
    );
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('DB Error:', error);
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

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/#news" className="inline-flex items-center text-amber-400 hover:text-amber-300 mb-6">
          ← بازگشت به اخبار
        </Link>

        {news.image_url && (
          <div className="relative w-full h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl bg-gray-800">
            <img 
              src={news.image_url} 
              alt={news.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-bold mb-4">{news.title}</h1>
        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-8">
          <span>{news.source_name || 'منبع ناشناس'}</span>
          <span>•</span>
          <span>{formatDate(news.published_at)}</span>
        </div>

        {news.video_url && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl">
            <video controls className="w-full aspect-video" poster={news.image_url || undefined}>
              <source src={news.video_url} type="video/mp4" />
              مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-2xl p-6 md:p-8 border border-white/5">
          <div className="prose prose-lg prose-invert max-w-none">
            {news.content.split('\n').map((p: string, i: number) => (
              <p key={i} className="mb-4 text-zinc-300 leading-relaxed">{p}</p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
