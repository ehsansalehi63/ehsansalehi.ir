import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { translate } from 'node-google-translator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RSS_FEEDS = [
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://feeds.mit.edu/mit_technology_review',
  'https://www.wired.com/feed/rss',
  'https://feeds.feedburner.com/zdnet/zdnet',
  'https://www.engadget.com/rss.xml',
  'https://arstechnica.com/feed/',
  'https://www.cnet.com/rss/news/',
  'https://www.scientificamerican.com/feed/',
  'https://www.bbc.com/news/technology/rss.xml',
];

// ترجمه با Google Translate (کاملاً رایگان)
async function translateToPersian(text: string): Promise<string> {
  if (!text || text.length < 3) return text;
  
  try {
    const result = await translate(text, { to: 'fa' });
    // اگر نتیجه با خطا شروع نشده باشد
    if (result.text && !result.text.startsWith('INVALID')) {
      return result.text;
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// دریافت محتوای کامل خبر
async function fetchFullContent(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    
    // حذف المان‌های غیرضروری
    $('script, style, nav, header, footer, aside, .ad, .advertisement').remove();
    
    // پیدا کردن محتوای اصلی
    const selectors = [
      'article .content',
      'article .entry-content', 
      'article .post-content',
      'main article p',
      '.article-content',
      '.post-content',
      '.entry-content',
      'article p',
    ];
    
    let content = '';
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 30) {
            content += text + '\n\n';
          }
        });
        if (content.length > 200) break;
      }
    }
    
    // اگر محتوایی پیدا نشد، از متا استفاده کن
    if (!content || content.length < 100) {
      content = $('meta[name="description"]').attr('content') || '';
    }
    
    return content || '';
  } catch {
    return '';
  }
}

async function extractImageAndVideo(url: string) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || null;
    const video = $('meta[property="og:video"]').attr('content') || 
                  $('video source').first().attr('src') || null;
    return { image, video };
  } catch {
    return { image: null, video: null };
  }
}

export async function GET() {
  try {
    const parser = new Parser();
    const allItems = [];
    let newCount = 0;
    let errorCount = 0;

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items.slice(0, 3)) {
          try {
            let fullContent = item.content || item['content:encoded'] || '';
            
            if (!fullContent || fullContent.length < 200) {
              const fetched = await fetchFullContent(item.link || '');
              if (fetched) fullContent = fetched;
            }
            
            if (!fullContent || fullContent.length < 50) {
              fullContent = item.contentSnippet || item.summary || '';
            }

            const { image, video } = await extractImageAndVideo(item.link || '');
            
            // ترجمه با Google Translate
            const persianTitle = await translateToPersian(item.title || '');
            const persianSummary = await translateToPersian(
              fullContent.slice(0, 300)
            );

            allItems.push({
              title: persianTitle || item.title || 'بدون عنوان',
              summary: persianSummary || fullContent.slice(0, 200) || '',
              content: fullContent || '',
              image_url: image || null,
              video_url: video || null,
              source_name: feed.title || 'منبع ناشناس',
              source_url: item.link || '',
              original_url: item.link || '',
              published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
              is_published: true,
            });
          } catch (itemError) {
            errorCount++;
          }
        }
      } catch (feedError) {
        console.error(`Feed error ${feedUrl}:`, feedError);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No items found',
        errors: errorCount,
      });
    }

    for (const item of allItems) {
      try {
        const [existing] = await pool.execute(
          'SELECT id FROM news_posts WHERE original_url = ?',
          [item.original_url || '']
        );

        if ((existing as any[]).length === 0) {
          await pool.execute(
            `INSERT INTO news_posts 
             (title, content, summary, image_url, video_url, source_name, source_url, original_url, published_at, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.title,
              item.content,
              item.summary,
              item.image_url,
              item.video_url,
              item.source_name,
              item.source_url,
              item.original_url || '',
              item.published_at,
              item.is_published,
            ]
          );
          newCount++;
        }
      } catch (dbError) {
        console.error('DB error:', dbError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      total: allItems.length, 
      new: newCount,
      errors: errorCount,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}
