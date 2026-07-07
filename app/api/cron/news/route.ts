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
];

async function translateToPersian(text: string): Promise<string> {
  if (!text || text.length < 3) return text;
  try {
    const result = await translate(text, { to: 'fa' });
    return result.text;
  } catch {
    return text;
  }
}

async function extractImageAndVideo(url: string) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    const image = $('meta[property="og:image"]').attr('content') || null;
    const video = $('meta[property="og:video"]').attr('content') || null;
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

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items.slice(0, 5)) {
          const { image, video } = await extractImageAndVideo(item.link || '');
          const persianTitle = await translateToPersian(item.title || '');
          const persianSummary = await translateToPersian(item.contentSnippet || item.content || '');

          allItems.push({
            title: persianTitle,
            summary: persianSummary,
            content: item.content || item.contentSnippet || persianSummary,
            image_url: image || null,
            video_url: video || null,
            source_name: feed.title || 'منبع ناشناس',
            source_url: item.link || '',
            original_url: item.link || '', // مقدار پیش‌فرض رشته خالی
            published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
            is_published: true,
          });
        }
      } catch (err) {
        console.error(`Error fetching ${feedUrl}:`, err);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ success: true, message: 'No new items found' });
    }

    for (const item of allItems) {
      // بررسی تکراری با original_url
      const [existing] = await pool.execute(
        'SELECT id FROM news_posts WHERE original_url = ?',
        [item.original_url || ''] // تضمین اینکه رشته است
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
    }

    return NextResponse.json({ success: true, total: allItems.length, new: newCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
