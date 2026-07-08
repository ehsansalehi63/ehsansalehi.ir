import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeAndTranslateNews } from '../../../lib/translateWithGPT';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ۱۵ منبع RSS (همان‌طور که خواستید)
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

// استخراج محتوا و عکس
async function extractFullContent(url: string) {
  try {
    const { data } = await axios.get(url, { timeout: 8000 });
    const $ = cheerio.load(data);
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .related, .social, .comments, .sidebar').remove();
    
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
    return { content: content.trim(), image, video };
  } catch {
    return { content: '', image: 'https://ehsansalehi.ir/images/og-image.jpg', video: null };
  }
}

// پردازش در پس‌زمینه: فقط یک خبر انتخاب و ذخیره می‌شود
async function processOneNews() {
  const parser = new Parser();
  let bestNews = null;
  let bestScore = -1;

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items.slice(0, 4)) {
        try {
          const { content, image, video } = await extractFullContent(item.link || '');
          
          // امتیازدهی به خبر: عکس خوب، محتوای طولانی، منبع معتبر
          let score = 0;
          if (image && !image.includes('og-image.jpg')) score += 20;
          if (content && content.length > 200) score += 10;
          if (video) score += 5;
          if (feed.title && ['TechCrunch', 'The Verge', 'Wired', 'ZDNet', 'Ars Technica'].includes(feed.title)) score += 15;
          
          if (score > bestScore) {
            bestScore = score;
            bestNews = {
              title: item.title || '',
              content: content || '',
              image: image,
              video: video || null,
              source_name: feed.title || 'منبع ناشناس',
              source_url: item.link || '',
              original_url: item.link || '',
              published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
            };
          }
        } catch {}
      }
    } catch {}
  }

  if (!bestNews) {
    console.log('⏭️ هیچ خبر جدیدی پیدا نشد');
    return null;
  }

  // بررسی تکراری نبودن
  const [existing] = await pool.execute(
    'SELECT id FROM news_posts WHERE original_url = ?',
    [bestNews.original_url]
  );
  if ((existing as any[]).length > 0) {
    console.log('⏭️ خبر تکراری است، رد شد');
    return null;
  }

  // ترجمه کامل فقط برای همین یک خبر
  const translated = await analyzeAndTranslateNews(
    bestNews.title,
    bestNews.content,
    bestNews.source_name
  );

  // ذخیره در دیتابیس
  await pool.execute(
    `INSERT INTO news_posts 
     (title, content, summary, image_url, video_url, source_name, source_url, original_url, published_at, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      translated.title || bestNews.title,
      translated.content || bestNews.content,
      translated.summary || bestNews.content.slice(0, 200),
      bestNews.image,
      bestNews.video,
      bestNews.source_name,
      bestNews.source_url,
      bestNews.original_url,
      bestNews.published_at,
      true,
    ]
  );

  console.log(`✅ یک خبر جدید ذخیره شد: ${translated.title}`);
  return translated.title;
}

// ============================================================
// پاسخ فوری به کرون‌جاب (کمتر از ۳ ثانیه)
// ============================================================
export async function GET() {
  try {
    // شروع پردازش در پس‌زمینه (بدون await)
    processOneNews().catch(err => console.error('❌ خطا:', err));

    return NextResponse.json({
      success: true,
      message: 'پردازش یک خبر در پس‌زمینه شروع شد.',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
