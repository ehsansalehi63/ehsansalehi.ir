import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { translate } from 'deeplx';

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

// ترجمه با DeepL (کیفیت عالی، رایگان)
async function translateToPersian(text: string): Promise<string> {
  if (!text || text.length < 5) return text;
  
  try {
    const result = await translate({
      text: text,
      source: 'en',
      target: 'fa',
    });
    return result || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// استخراج محتوای کامل و عکس
async function extractFullContent(url: string): Promise<{ content: string; image: string | null; video: string | null }> {
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);
    
    // حذف المان‌های اضافی
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .related, .social, .comments, .sidebar').remove();
    
    // عکس اصلی
    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || 
                  $('article img').first().attr('src') || null;
    
    const video = $('meta[property="og:video"]').attr('content') || 
                  $('video source').first().attr('src') || null;
    
    // محتوای متن
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
  } catch (error) {
    return { content: '', image: null, video: null };
  }
}

export async function GET() {
  try {
    const parser = new Parser();
    const allItems = [];
    let newCount = 0;
    let skippedNoImage = 0;

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items.slice(0, 3)) {
          try {
            const { content, image, video } = await extractFullContent(item.link || '');
            
            // فقط خبرهایی با عکس ذخیره شوند
            if (!image) {
              skippedNoImage++;
              continue;
            }
            
            // ترجمه عنوان و محتوا با DeepL
            const [persianTitle, persianContent] = await Promise.all([
              translateToPersian(item.title || ''),
              content ? translateToPersian(content) : Promise.resolve(''),
            ]);
            
            const finalTitle = persianTitle || item.title || 'بدون عنوان';
            const finalContent = persianContent || content || '';
            const summary = finalContent.slice(0, 200) + (finalContent.length > 200 ? '...' : '');

            allItems.push({
              title: finalTitle,
              summary: summary,
              content: finalContent,
              image_url: image,
              video_url: video || null,
              source_name: feed.title || 'منبع ناشناس',
              source_url: item.link || '',
              original_url: item.link || '',
              published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
              is_published: true,
            });
          } catch (itemError) {
            console.error('Error processing item:', itemError);
          }
        }
      } catch (feedError) {
        console.error(`Feed error ${feedUrl}:`, feedError);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No items with images found',
        skippedNoImage,
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
        console.error('DB error:', dbError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      total: allItems.length, 
      new: newCount,
      skippedNoImage,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}
