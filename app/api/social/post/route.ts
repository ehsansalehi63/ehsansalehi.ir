import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { postNewsToAllChannels } from '../../../lib/socialPoster';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET() {
  try {
    // دریافت اخباری که هنوز ارسال نشده‌اند
    const [rows] = await pool.execute(
      `SELECT id, title, summary, image_url 
       FROM news_posts 
       WHERE is_published = TRUE 
         AND (posted_to_social IS NULL OR posted_to_social = '')
       ORDER BY published_at DESC 
       LIMIT 5`
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'هیچ خبر جدیدی برای ارسال وجود ندارد' 
      });
    }

    const results = [];
    for (const news of rows as any[]) {
      const link = `https://ehsansalehi.ir/news/${news.id}`;
      const result = await postNewsToAllChannels(
        news.id,
        news.title,
        news.summary || news.title,
        news.image_url,
        link
      );
      results.push({ id: news.id, ...result });
    }

    return NextResponse.json({ 
      success: true, 
      results,
      message: `${results.length} خبر ارسال شد`,
    });
  } catch (error: any) {
    console.error('Social post error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
