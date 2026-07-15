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
  // رمزارز و بلاکچین (Crypto & Blockchain)
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://decrypt.co/feed',
  'https://news.bitcoin.com/feed/',
  'https://cryptoslate.com/feed/',
  // هوش مصنوعی و فناوری (AI & Tech)
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
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain') || text.includes('coin') || text.includes('token') || text.includes('solana') || text.includes('binance') || text.includes('بیت کوین') || text.includes('رمز ارز') || text.includes('ارز دیجیتال') || text.includes('بلاکچین') || feedUrl.includes('coindesk') || feedUrl.includes('cointelegraph') || feedUrl.includes('decrypt') || feedUrl.includes('bitcoin')) {
    return 'رمزارز و بلاکچین';
  }
  if (text.includes('ai ') || text.includes('artificial intelligence') || text.includes('chatgpt') || text.includes('openai') || text.includes('llm') || text.includes('gemini') || text.includes('claude') || text.includes('machine learning') || text.includes('هوش مصنوعی') || text.includes('یادگیری ماشین')) {
    return 'هوش مصنوعی';
  }
  if (text.includes('security') || text.includes('cyber') || text.includes('hack') || text.includes('vulnerability') || text.includes('malware') || text.includes('امنیت') || text.includes('هک') || text.includes('باگ') || text.includes('سایبری')) {
    return 'امنیت سایبری';
  }
  if (text.includes('apple') || text.includes('samsung') || text.includes('phone') || text.includes('android') || text.includes('gpu') || text.includes('cpu') || text.includes('intel') || text.includes('nvidia') || text.includes('اپل') || text.includes('سامسونگ') || text.includes('موبایل') || text.includes('سخت افزار')) {
    return 'سخت‌افزار و گجت';
  }
  return 'فناوری و نرم‌افزار';
}

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
      'article',
    ];
    
    for (const selector of selectors) {
      const el = $(selector);
      if (el.length > 0) {
        content = el.text().trim();
        break;
      }
    }
    
    if (!content) {
      content = $('body').text().trim();
    }
    
    content = content.replace(/\s+/g, ' ').slice(0, 3000);
    return { content, image };
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
    let chosenFeed = '';

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        const item = feed.items[0];
        if (!item) continue;
        
        const { content, image } = await extractFullContent(item.link || '');
        
        let score = 0;
        if (image && !image.includes('og-image.jpg')) score += 20;
        if (content.length > 500) score += 30;
        if (item.pubDate) {
          const hoursAgo = (Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60);
          if (hoursAgo < 12) score += 50 - Math.min(hoursAgo * 4, 40);
        }
        
        if (score > bestScore) {
          bestScore = score;
          chosenFeed = feedUrl;
          bestNews = {
            title: item.title || '',
            content,
            image,
            source_name: feed.title || new URL(feedUrl).hostname,
            source_url: feed.link || feedUrl,
            original_url: item.link || '',
            published_at: item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
          };
        }
      } catch (err: any) {
        console.error(`خطا در ${feedUrl}:`, err.message || err);
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
      socialResults = await postNewsToAllChannels(
        newId,
        translated.title || bestNews.title,
        translated.summary || bestNews.content.slice(0, 200),
        bestNews.image,
        link,
        bestNews.source_name || 'فناوری و رمزارز'
      );
    }

    return NextResponse.json({
      success: true,
      message: 'یک خبر جدید ذخیره و به صورت در لحظه روی شبکه‌های اجتماعی منتشر شد',
      title: translated.title,
      category,
      socialResults,
    });
  } catch (error: any) {
    console.error('❌ خطا در کرون‌جاب:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'خطای ناشناخته در کرون' 
    }, { status: 500 });
  }
}
