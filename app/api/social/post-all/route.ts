import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { postNewsToAllChannels } from '../../../lib/socialPoster';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    // دریافت تمامی اخباری که هنوز ارسال نشده‌اند یا حداقل روی یکی از شبکه‌های اصلی ناموفق بودند
    const [rows] = await pool.execute(
      `SELECT id, title, summary, image_url, source_name 
       FROM news_posts 
       WHERE is_published = TRUE 
         AND (
           posted_to_social IS NULL 
           OR posted_to_social = '' 
           OR posted_to_social NOT LIKE '%"telegram":true%' 
           OR posted_to_social NOT LIKE '%"linkedin":true%'
           OR posted_to_social NOT LIKE '%"eitaa":true%'
           OR posted_to_social NOT LIKE '%"bale":true%'
         )
       ORDER BY published_at DESC 
       LIMIT 15`
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'تمامی اخبار موجود در دیتابیس قبلاً روی تمام شبکه‌های اجتماعی منتشر شده‌اند' 
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
        link,
        news.source_name || 'فناوری و رمزارز'
      );
      
      results.push({ 
        id: news.id, 
        title: news.title, 
        success: result.success,
        results: result.results,
        errors: result.errors,
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
      message: `🎉 بررسی و انتشار ${successCount} خبر با موفقیت روی شبکه‌های اجتماعی انجام شد (${failCount} ناموفق)`,
    });
  } catch (error: any) {
    console.error('Social post all error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
