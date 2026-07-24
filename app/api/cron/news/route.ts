import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeAndTranslateNews } from '../../../lib/translateWithGPT';
import { verifyCron } from '../../../lib/auth';
import { postNewsToAllChannels } from '../../../lib/socialPoster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RSS_FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://decrypt.co/feed',
  'https://news.bitcoin.com/feed/',
  'https://cryptoslate.com/feed/',
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://www.wired.com/feed/rss',
  'https://feeds.feedburner.com/zdnet/zdnet',
  'https://arstechnica.com/feed/',
  'https://www.engadget.com/rss.xml',
  'https://www.cnet.com/rss/news/',
  'https://www.digitaltrends.com/feed/',
  'https://www.techradar.com/rss',
];

function detectCategory(title: string, content: string, feedUrl: string): string {
  const text = (title + ' ' + content + ' ' + feedUrl).toLowerCase();
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain') || text.includes('coin')) return 'رمزارز و بلاکچین';
  if (text.includes('ai ') || text.includes('artificial intelligence') || text.includes('chatgpt') || text.includes('openai') || text.includes('llm') || text.includes('هوش مصنوعی')) return 'هوش مصنوعی';
  if (text.includes('security') || text.includes('cyber') || text.includes('hack') || text.includes('امنیت') || text.includes('هک') || text.includes('سایبری')) return 'امنیت سایبری';
  if (text.includes('apple') || text.includes('samsung') || text.includes('phone') || text.includes('موبایل') || text.includes('سخت افزار')) return 'سخت‌افزار و گجت';
  return 'فناوری و نرم‌افزار';
}

async function extractFullContent(url: string) {
  try {
    const { data } = await axios.get(url, { 
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(data);
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();
    
    let image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || $('article img').first().attr('src') || null;
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
    const selectors = ['article .entry-content', 'article .post-content', 'article .content', 'main article', '.article-content', '.post-content', 'article'];
    for (const selector of selectors) {
      const el = $(selector);
      if (el.length > 0) { content = el.text().trim(); break; }
    }
    if (!content) content = $('body').text().trim();
    content = content.replace(/\s+/g, ' ').slice(0, 3000);
    return { content, image };
  } catch (err) {
    console.error(`Failed to extract content from ${url} - likely timeout or blocked`);
    return { content: '', image: 'https://ehsansalehi.ir/images/og-image.jpg' };
  }
}

// Added timeout wrapper for feed parsing because Iranian internet might block them
const fetchFeedWithTimeout = async (feedUrl: string, timeoutMs: number) => {
  const parser = new Parser();
  return Promise.race([
    parser.parseURL(feedUrl),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Feed timeout')), timeoutMs))
  ]);
};

export async function GET(request: NextRequest) {
  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    let bestNews = null;
    let bestScore = -1;
    let chosenFeed = '';

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed: any = await fetchFeedWithTimeout(feedUrl, 6000); // Strict 6 second timeout per feed
        const item = feed.items[0];
        if (!item) continue;
        
        const { content, image } = await extractFullContent(item.link || '');
        let score = 0;
        if (image && !image.includes('og-image.jpg')) score += 20;
        if (content.length > 500) score += 30;
        if (item.pubDate) {
          const hoursAgo = (Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60);
          if (hoursAgo < 12) score += 50;
        }

        if (score > bestScore) {
          bestScore = score;
          bestNews = {
            title: item.title || '',
            content: content || item.contentSnippet || item.content || '',
            image: image,
            source_url: item.link || '',
            original_url: item.link || '',
            source_name: feed.title || new URL(feedUrl).hostname,
            published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
          };
          chosenFeed = feedUrl;
        }
      } catch (e: any) {
        console.error(`Skipping feed ${feedUrl}: ${e.message}`);
      }
    }

    if (!bestNews) {
      return NextResponse.json({ success: false, message: 'هیچ خبر مناسبی یافت نشد یا ارتباط مسدود است.' });
    }

    const [existingRows]: any = await pool.execute(
      'SELECT id FROM news_posts WHERE title = ? OR original_url = ? LIMIT 1',
      [bestNews.title, bestNews.original_url]
    );

    if (existingRows && existingRows.length > 0) {
      return NextResponse.json({ success: true, message: 'خبر تکراری است' });
    }

    const category = detectCategory(bestNews.title, bestNews.content, chosenFeed);

    const translated = await analyzeAndTranslateNews(
      bestNews.title,
      bestNews.content,
      bestNews.source_name
    );

    const [insertResult] = await pool.execute(
      `INSERT INTO news_posts 
       (title, content, summary, image_url, source_name, source_url, original_url, published_at, is_published, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        category,
      ]
    );

    const newId = (insertResult as any)?.insertId;
    let socialResults = null;
    if (newId) {
      const link = `https://ehsansalehi.ir/news/${newId}`;
      console.log(`🚀 خبر جدید (ID: ${newId}) ذخیره شد، شروع انتشار فوری روی تمام شبکه‌های اجتماعی...`);
      // We purposefully don't await the social poster to avoid timing out the web request
      postNewsToAllChannels(
        newId,
        translated.title || bestNews.title,
        translated.summary || bestNews.content.slice(0, 200),
        bestNews.image,
        link,
        bestNews.source_name || 'فناوری و رمزارز'
      ).catch(e => console.error("Social post error:", e));
      socialResults = "Started in background";
    }

    return NextResponse.json({
      success: true,
      message: 'یک خبر جدید ذخیره و به صورت در لحظه منتشر شد',
      title: translated.title,
      category,
      socialResults,
    });
  } catch (error: any) {
    console.error('❌ خطا در کرون‌جاب:', error);
    return NextResponse.json({ success: false, error: error.message || 'خطای ناشناخته در کرون' }, { status: 500 });
  }
}
