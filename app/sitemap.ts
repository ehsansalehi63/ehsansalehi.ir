import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ehsansalehi.ir';
  
  // صفحات ثابت
  const staticPages = [
    '',
    '/news',
    '/auth/login',
    '/auth/register',
    '/dashboard',
    '/projects',
  ];
  
  const sitemapEntries = staticPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: page === '' ? 1.0 : 0.8,
  }));
  
  // در صورت نیاز می‌توانید پروژه‌ها و اخبار را هم به نقشه سایت اضافه کنید
  // اینجا یک نمونه ساده برای اخبار اضافه شده است
  try {
    const { pool } = await import('../lib/db');
    const [newsRows] = await pool.execute(
      'SELECT id, published_at FROM news_posts WHERE is_published = TRUE ORDER BY published_at DESC LIMIT 100'
    );
    
    const newsEntries = (newsRows as any[]).map((news) => ({
      url: `${baseUrl}/news/${news.id}`,
      lastModified: news.published_at ? new Date(news.published_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));
    
    sitemapEntries.push(...newsEntries);
  } catch (error) {
    console.error('Error fetching news for sitemap:', error);
  }
  
  return sitemapEntries;
}
