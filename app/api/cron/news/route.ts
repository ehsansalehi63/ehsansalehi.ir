import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeAndTranslateNews } from '../../../lib/translateWithGPT';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ۱۵ منبع RSS معتبر
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

async function extractFullContent(url: string): Promise<{ content: string; image: string | null; video: string | null }> {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .related, .social, .comments, .sidebar').remove();
    
    let image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') || 
                $('article img').first().attr('src') || 
                $('.featured-image img').attr('src') || null;
    
    if (image && !image.startsWith('http')) {
      if (image.startsWith('/')) {
        const baseUrl = new URL(url).origin;
        image = baseUrl + image;
      } else {
        image = null;
      }
    }
    
    const defaultImage = 'https://ehsansalehi.ir/images/og-image.jpg';
    const finalImage = image || defaultImage;
    
    const video = $('meta[property="og:video"]').attr('content') || 
                  $('video source').first().attr('src') || null;
    
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
        if (content.length > 500) break;
      }
    }
    
    if (!content || content.length < 100) {
      content = $('meta[name="description"]').attr('content') || '';
    }
    
    return { content: content.trim(), image: finalImage, video };
  } catch (error) {
    return { 
      content: '', 
      image: 'https://ehsansalehi.ir/images/og-image.jpg', 
      video: null 
    };
  }
}

export async function GET() {
  try {
    const parser = new Parser();
    const allItems = [];

    // دریافت همه اخبار از همه منابع
    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items.slice(0, 3)) {
          const { content, image, video } = await extractFullContent(item.link || '');
          allItems.push({
            title: item.title || 'بدون عنوان',
            content: content || '',
            summary: item.contentSnippet || '',
            image_url: image,
            video_url: video || null,
            source_name: feed.title || 'منبع ناشناس',
            source_url: item.link || '',
            original_url: item.link || '',
            published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
            is_published: true,
          });
        }
      } catch (feedError) {
        console.error(`❌ خطا در منبع ${feedUrl}:`, feedError);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'هیچ خبری دریافت نشد',
      });
    }

    // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
    allItems.sort((a, b) => b.published_at.getTime() - a.published_at.getTime());

    // پیدا کردن اولین خبری که در دیتابیس نیست
    let selectedNews = null;
    for (const item of allItems) {
      const [existing] = await pool.execute(
        'SELECT id FROM news_posts WHERE original_url = ?',
        [item.original_url || '']
      );
      if ((existing as any[]).length === 0) {
        selectedNews = item;
        break;
      }
    }

    if (!selectedNews) {
      return NextResponse.json({ 
        success: true, 
        message: 'همه اخبار تکراری هستند، خبر جدیدی وجود ندارد',
        total: allItems.length,
      });
    }

    // ترجمه فقط برای یک خبر (با GPT)
    const translated = await analyzeAndTranslateNews(
      selectedNews.title,
      selectedNews.content,
      selectedNews.source_name
    );

    // ذخیره در دیتابیس
    await pool.execute(
      `INSERT INTO news_posts 
       (title, content, summary, image_url, video_url, source_name, source_url, original_url, published_at, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        translated.title || selectedNews.title,
        translated.content || selectedNews.content,
        translated.summary || selectedNews.summary,
        selectedNews.image_url,
        selectedNews.video_url,
        selectedNews.source_name,
        selectedNews.source_url,
        selectedNews.original_url || '',
        selectedNews.published_at,
        selectedNews.is_published,
      ]
    );

    return NextResponse.json({ 
      success: true, 
      total: allItems.length,
      saved: 1,
      message: `✅ یک خبر جدید ذخیره شد: ${translated.title || selectedNews.title}`,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'خطای ناشناخته',
    }, { status: 500 });
  }
}
