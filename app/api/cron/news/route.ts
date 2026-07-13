import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeAndTranslateNews } from '../../../lib/translateWithGPT';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RSS_FEEDS = [
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://www.wired.com/feed/rss',
  'https://feeds.feedburner.com/zdnet/zdnet',
  'https://arstechnica.com/feed/',
  'https://www.engadget.com/rss.xml',
  'https://www.cnet.com/rss/news/',
  'https://www.scientificamerican.com/feed/',
  'https://www.bbc.com/news/technology/rss.xml',
  'https://www.theguardian.com/technology/rss',
  'https://mashable.com/feeds/rss/tech',
  'https://www.digitaltrends.com/feed/',
  'https://www.techradar.com/rss',
  'https://www.cnet.com/rss/tech/',
  'https://www.pcmag.com/feed',
];

async function extractFullContent(url: string) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();
    
    let image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') || 
                $('article img').first().attr('src') || null;
    if (image && !image.startsWith('http')) {
      if (image.startsWith('/')) {
        const baseUrl = new URL(url).origin;
        image = baseUrl + image;
      } else {
        image = null;
      }
    }
    image = image || 'https://ehsansalehi.ir/images/og-image.jpg';
    
    let content = '';
    const selectors = [
      'article .entry-content',
      'article .post-content',
      'article .content',
      'main article',
      '.article-content',
      '.post-content',
      '.entry-content',
      'article',
    ];
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.find('p').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 30 && !text.startsWith('©') && !text.includes('Subscribe')) {
            content += text + '\n\n';
          }
        });
        if (content.length > 400) break;
      }
    }
    if (!content || content.length < 50) {
      content = $('meta[name="description"]').attr('content') || '';
    }
    return { content: content.trim(), image };
  } catch {
    return { content: '', image: 'https://ehsansalehi.ir/images/og-image.jpg' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    const parser = new Parser();
    let bestNews = null;
    let bestScore = -1;

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        const item = feed.items[0];
        if (!item) continue;
        
        const { content, image } = await extractFullContent(item.link || '');
        
        let score = 0;
        if (image && !image.includes('og-image.jpg')) score += 20;
        if (content && content.length > 200) score += 10;
        if (feed.title && ['TechCrunch', 'The Verge', 'Wired', 'ZDNet', 'Ars Technica'].includes(feed.title)) score += 15;
        
        if (score > bestScore) {
          bestScore = score;
          bestNews = {
            title: item.title || '',
            content: content || '',
            image: image,
            source_name: feed.title || 'منبع ناشناس',
            source_url: item.link || '',
            original_url: item.link || '',
            published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
          };
        }
      } catch (err) {
        // اصلاح: استفاده از err به‌عنوان any برای دسترسی به message
        const error = err as any;
        console.error(`خطا در ${feedUrl}:`, error.message || error);
      }
    }

    if (!bestNews) {
      return NextResponse.json({ 
        success: false, 
        message: 'هیچ خبری یافت نشد' 
      });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM news_posts WHERE original_url = ?',
      [bestNews.original_url]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'خبر تکراری است' 
      });
    }

    const translated = await analyzeAndTranslateNews(
      bestNews.title,
      bestNews.content,
      bestNews.source_name
    );

    await pool.execute(
      `INSERT INTO news_posts 
       (title, content, summary, image_url, source_name, source_url, original_url, published_at, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        translated.title || bestNews.title,
        translated.content || bestNews.content,
        translated.summary || bestNews.content.slice(0, 200),
        bestNews.image,
        bestNews.source_name,
        bestNews.source_url,
        bestNews.original_url,
        bestNews.published_at,
        true,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'یک خبر جدید ذخیره شد',
      title: translated.title,
    });
  } catch (error) {
    console.error('❌ خطا:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message || 'خطای ناشناخته',
    }, { status: 500 });
  }
}
