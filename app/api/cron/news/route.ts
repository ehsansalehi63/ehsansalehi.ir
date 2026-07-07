import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// لیست گسترده منابع RSS
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

// تابع ترجمه با استفاده از MyMemory (رایگان و بدون نیاز به کلید)
async function translateToPersian(text: string): Promise<string> {
  if (!text || text.length < 5) return text;
  
  try {
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text.slice(0, 1000), // محدودیت ۱۰۰۰ کاراکتر
        langpair: 'en|fa',
        de: 'ehsansalehi.ir', // شناسه برای استفاده رایگان
      },
      timeout: 15000,
    });
    
    if (response.data && response.data.responseData) {
      const translated = response.data.responseData.translatedText;
      if (translated && translated !== text) {
        return translated;
      }
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// دریافت محتوای کامل خبر از لینک (اگر RSS خلاصه داده باشد)
async function fetchFullContent(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    
    // تلاش برای پیدا کردن محتوای اصلی
    let content = '';
    
    // روش‌های مختلف برای استخراج محتوا
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
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 50) {
            content += text + '\n\n';
          }
        });
        break;
      }
    }
    
    // اگر محتوایی پیدا نشد، از متای description استفاده کن
    if (!content || content.length < 100) {
      content = $('meta[name="description"]').attr('content') || '';
      if (content) content = content.trim();
    }
    
    return content || '';
  } catch {
    return '';
  }
}

// استخراج عکس و ویدیو
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
        console.log(`Fetching: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        
        for (const item of feed.items.slice(0, 3)) { // هر منبع ۳ خبر
          try {
            // دریافت محتوای کامل
            let fullContent = item.content || item['content:encoded'] || '';
            
            // اگر محتوا کوتاه است، از لینک خبر دریافت کن
            if (!fullContent || fullContent.length < 200) {
              const fetchedContent = await fetchFullContent(item.link || '');
              if (fetchedContent) {
                fullContent = fetchedContent;
              }
            }
            
            // اگر باز هم محتوا نداشت، از خلاصه استفاده کن
            if (!fullContent || fullContent.length < 50) {
              fullContent = item.contentSnippet || item.summary || '';
            }

            // استخراج عکس و ویدیو
            const { image, video } = await extractImageAndVideo(item.link || '');
            
            // ترجمه عنوان و خلاصه
            const persianTitle = await translateToPersian(item.title || '');
            const persianSummary = await translateToPersian(
              fullContent.slice(0, 300) // فقط ۳۰۰ کاراکتر اول برای خلاصه
            );
            
            // اگر ترجمه کار نکرد، متن اصلی را نگه دار
            const finalTitle = persianTitle || item.title || 'بدون عنوان';
            const finalSummary = persianSummary || fullContent.slice(0, 200) || '';

            allItems.push({
              title: finalTitle,
              summary: finalSummary,
              content: fullContent || finalSummary,
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
            console.error('Error processing item:', itemError);
          }
        }
      } catch (feedError) {
        console.error(`Error fetching feed ${feedUrl}:`, feedError);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No items found',
        errors: errorCount,
      });
    }

    // ذخیره در دیتابیس
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
        console.error('Database error:', dbError);
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
