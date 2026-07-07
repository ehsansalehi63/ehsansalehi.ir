import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeAndTranslateNews } from '../../../lib/translateWithGPT';

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

async function extractFullContent(url: string): Promise<{ content: string; image: string | null; video: string | null }> {
  try {
    const { data } = await axios.get(url, { timeout: 20000 });
    const $ = cheerio.load(data);
    
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .related, .social, .comments, .sidebar').remove();
    
    // استخراج عکس با اولویت‌های مختلف
    let image = null;
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'article img',
      '.featured-image img',
      '.post-image img',
      '.entry-image img',
      'img.wp-post-image',
      'img.attachment-large',
      'img.attachment-full',
    ];
    
    for (const selector of imageSelectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        let src = el.attr('content') || el.attr('src');
        if (src && src.startsWith('http')) {
          image = src;
          break;
        }
      }
    }
    
    // اگر عکس نسبی بود، کاملش کن
    if (image && !image.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      image = new URL(image, baseUrl).href;
    }

    // استخراج ویدیو
    let video = null;
    const videoSelectors = [
      'meta[property="og:video"]',
      'video source',
      'video',
    ];
    for (const selector of videoSelectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        let src = el.attr('content') || el.attr('src');
        if (src && src.startsWith('http')) {
          video = src;
          break;
        }
      }
    }

    // استخراج محتوا
    let content = '';
    const contentSelectors = [
      'article .entry-content p',
      'article .post-content p',
      'article .content p',
      'main article p',
      '.article-content p',
      '.post-content p',
      '.entry-content p',
      'article p',
    ];
    
    for (const selector of contentSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 30 && !text.startsWith('©') && !text.includes('Subscribe') && !text.includes('Newsletter')) {
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
    console.error('Extraction error:', error);
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
            
            // فقط خبرهایی که عکس دارند ذخیره کن
            if (!image) {
              skippedNoImage++;
              continue;
            }
            
            const translated = await analyzeAndTranslateNews(
              item.title || '',
              content || '',
              feed.title || 'منبع ناشناس'
            );

            allItems.push({
              title: translated.title || item.title || 'بدون عنوان',
              summary: translated.summary || content.slice(0, 200),
              content: translated.content || content || '',
              image_url: image,
              video_url: video || null,
              source_name: feed.title || 'منبع ناشناس',
              source_url: item.link || '',
              original_url: item.link || '',
              published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
              is_published: true,
            });
          } catch (itemError) {
            console.error('Item error:', itemError);
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
