import { Metadata } from 'next';
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

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { id } = await params;
  const news = await getNews(id);

  if (!news) {
    return {
      title: 'خبر یافت نشد | احسان صالحی',
      description: 'مقاله یا خبر مورد نظر در پایگاه داده یافت نشد.',
    };
  }

  const title = news.title || 'اخبار فناوری و هوش مصنوعی';
  const rawSummary = (news.summary || news.content || '').replace(/<[^>]*>?/gm, '').slice(0, 160);
  const description = rawSummary || 'آخرین اخبار و تحلیل‌های تخصصی فناوری، هوش مصنوعی، رمزارز و امنیت شبکه با تحلیل مهندس احسان صالحی با ۲۰ سال سابقه';
  const imageUrl = news.image_url || 'https://ehsansalehi.ir/images/og-image.jpg';
  const canonicalUrl = `https://ehsansalehi.ir/news/${id}`;

  return {
    title: `${title} | احسان صالحی`,
    description,
    keywords: [
      'احسان صالحی',
      'اخبار فناوری',
      news.category || 'هوش مصنوعی',
      'رمزارز',
      'بیت کوین',
      'امنیت شبکه',
      'توسعه وب',
      'اصفهان',
    ],
    authors: [{ name: 'احسان صالحی', url: 'https://ehsansalehi.ir' }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | تحلیل اختصاصی احسان صالحی`,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: news.published_at ? new Date(news.published_at).toISOString() : new Date().toISOString(),
      authors: ['https://ehsansalehi.ir'],
      siteName: 'احسان صالحی | معمار شبکه و متخصص IT',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | احسان صالحی`,
      description,
      images: [imageUrl],
    },
  };
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
