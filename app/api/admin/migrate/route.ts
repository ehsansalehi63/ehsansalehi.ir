import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { pool } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pass = url.searchParams.get('pass') || process.env.OLD_DB_PASS;
    
    if (!pass) {
      return NextResponse.json({ success: false, error: 'Password is required either via ?pass= param or OLD_DB_PASS env var.' });
    }

    console.log("Connecting to old Vercel DB on Hostinger...");
    const oldDb = await mysql.createConnection({
      host: '82.112.229.184',
      user: 'u699154314_ehsansalehi',
      password: pass,
      database: 'u699154314_ehsansalehi',
      connectTimeout: 10000
    });

    console.log("Fetching old news...");
    const [oldNews]: any = await oldDb.execute('SELECT * FROM news_posts');
    await oldDb.end();

    console.log(`Found ${oldNews.length} news items. Transferring to new DB...`);
    let count = 0;
    
    for (const news of oldNews) {
      const [existing]: any = await pool.execute('SELECT id FROM news_posts WHERE id = ? OR original_url = ?', [news.id, news.original_url]);
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO news_posts 
           (id, title, content, summary, image_url, source_name, source_url, original_url, published_at, created_at, updated_at, is_published, view_count, category)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            news.id, news.title, news.content, news.summary, news.image_url, news.source_name, 
            news.source_url, news.original_url, news.published_at, news.created_at, news.updated_at, 
            news.is_published, news.view_count || 0, news.category || 'فناوری و نرم‌افزار'
          ]
        );
        count++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully transferred ${count} news items from Hostinger to Mizbanfa!` });
  } catch (error: any) {
    console.error('Migration Error:', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
