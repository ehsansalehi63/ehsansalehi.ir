import { MetadataRoute } from 'next';
import { query } from './lib/mysql';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ehsansalehi.ir';
  
  const staticPages = [
    { url: `${baseUrl}`, changeFrequency: 'hourly' as const, priority: 1.0 },
    { url: `${baseUrl}/news`, changeFrequency: 'hourly' as const, priority: 0.95 },
    { url: `${baseUrl}/dashboard`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${baseUrl}/projects`, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/auth/login`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/auth/register`, changeFrequency: 'monthly' as const, priority: 0.5 },
  ];
  
  const sitemapEntries: MetadataRoute.Sitemap = [...staticPages];
  
  // 1. پروژه ها
  try {
    const projects = await query<{ id: number; createdAt: string }>('SELECT id, createdAt FROM projects ORDER BY id DESC LIMIT 100');
    if (projects && projects.length > 0) {
      const projectEntries = projects.map((p) => ({
        url: `${baseUrl}/projects/${p.id}`,
        lastModified: p.createdAt ? new Date(p.createdAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }));
      sitemapEntries.push(...projectEntries);
    }
  } catch (error) {
    console.error('Error fetching projects for sitemap:', error);
  }

  // 2. اخبار (با اولویت بالا برای ایندکس سریع سرچ کنسول)
  try {
    const newsRows = await query<{ id: number; published_at: string }>(
      'SELECT id, published_at FROM news_posts WHERE is_published = TRUE ORDER BY published_at DESC LIMIT 200'
    );
    if (newsRows && newsRows.length > 0) {
      const newsEntries = newsRows.map((news) => ({
        url: `${baseUrl}/news/${news.id}`,
        lastModified: news.published_at ? new Date(news.published_at) : new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      }));
      sitemapEntries.push(...newsEntries);
    }
  } catch (error) {
    console.error('Error fetching news for sitemap:', error);
  }

  // 3. وبلاگ
  try {
    const blogRows = await query<{ id: number; created_at: string }>(
      'SELECT id, created_at FROM blog_posts WHERE status = "published" ORDER BY created_at DESC LIMIT 100'
    );
    if (blogRows && blogRows.length > 0) {
      const blogEntries = blogRows.map((post) => ({
        url: `${baseUrl}/blog/${post.id}`,
        lastModified: post.created_at ? new Date(post.created_at) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
      sitemapEntries.push(...blogEntries);
    }
  } catch (error) {
    console.error('Error fetching blog for sitemap:', error);
  }
  
  return sitemapEntries;
}
