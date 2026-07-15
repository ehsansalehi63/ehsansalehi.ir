import { notFound } from 'next/navigation';
import { pool } from '../../lib/db';
import NewsDetailView from './NewsDetailView';

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
  } catch {
    return null;
  }
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { id } = await params;
  const news = await getNews(id);
  const newsId = parseInt(id);

  if (!news) {
    notFound();
  }

  return <NewsDetailView news={news} newsId={newsId} />;
}
