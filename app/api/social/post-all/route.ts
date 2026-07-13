import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { postNewsToAllChannels } from '../../../lib/socialPoster';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // ۵ دقیقه زمان برای ارسال همه اخبار

export async function GET(request: NextRequest) {
  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    // دریافت همه اخباری که تاکنون ارسال نشده‌اند
    const [rows] = await pool.execute(
      `SELECT id, title, summary, image_url 
       FROM news_posts 
       WHERE is_published = TRUE 
         AND (posted_to_social IS NULL OR posted_to_social = '')
       ORDER BY published_at ASC`
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'همه اخبار قبلاً ارسال شده‌اند' 
      });
    }

    const allNews = rows as any[];
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const news of allNews) {
      const link = `https://ehsansalehi.ir/news/${news.id}`;
      const result = await postNewsToAllChannels(
        news.id,
        news.title,
        news.summary || news.title,
        news.image_url,
        link
      );
      
      results.push({ 
        id: news.id, 
        title: news.title, 
        success: result.success,
        results: result.results 
      });

      if (result.success) successCount++;
      else failCount++;
    }

    return NextResponse.json({ 
      success: true, 
      total: allNews.length,
      successCount,
      failCount,
      results,
      message: `${successCount} خبر با موفقیت ارسال شد، ${failCount} خبر ناموفق بود`,
    });
  } catch (error: any) {
    console.error('Social post all error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
