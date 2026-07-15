import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { postNewsToAllChannels } from '../../../lib/socialPoster';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    // دریافت اخباری که هنوز ارسال نشده‌اند یا حداقل روی یکی از شبکه‌های اصلی (تلگرام، لینکدین، ایتا، بله) ارسال ناموفق داشته‌اند
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
       LIMIT 5`
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'تمام اخبار داغ اخیر قبلاً روی تمامی شبکه‌های اجتماعی (تلگرام، لینکدین، ایتا، بله) منتشر شده‌اند' 
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
        link,
        news.source_name || 'فناوری و رمزارز'
      );
      results.push({ id: news.id, title: news.title, ...result });
    }

    return NextResponse.json({ 
      success: true, 
      results,
      message: `🎉 تعداد ${results.length} خبر جدید یا بازنشری روی شبکه‌های اجتماعی (تلگرام، لینکدین، ایتا، بله) بررسی و منتشر شد`,
    });
  } catch (error: any) {
    console.error('Social post error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
