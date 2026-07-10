import { NextResponse } from 'next/server';
import { sendToEitaa } from '../../lib/socialPoster';
import { pool } from '../../lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute('SELECT id, title, summary, image_url FROM news_posts ORDER BY id DESC LIMIT 1');
    const news = (rows as any[])[0];
    if (!news) return NextResponse.json({ error: 'No news found' });

    const result = await sendToEitaa(
      news.title,
      news.summary || news.title,
      news.image_url,
      `https://ehsansalehi.ir/news/${news.id}`,
      'منبع تست'
    );

    return NextResponse.json({ success: result, message: result ? 'ارسال موفق' : 'ارسال ناموفق' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
