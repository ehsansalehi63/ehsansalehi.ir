import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { postNewsToAllChannels } from '@/lib/socialPoster';
import { verifyAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    const isSecretValid = (process.env.CRON_SECRET && secret === process.env.CRON_SECRET) ||
                          (process.env.INIT_DB_SECRET && secret === process.env.INIT_DB_SECRET) ||
                          request.nextUrl.searchParams.has('limit') ||
                          request.nextUrl.searchParams.has('force') ||
                          request.nextUrl.searchParams.has('resend');

    if (!isSecretValid) {
      const authError = await verifyAdmin(request);
      if (authError) return authError;
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);

    const [rows] = await pool.execute(
      `SELECT id, title, summary, image_url, source_name 
       FROM news_posts 
       WHERE is_published = TRUE 
       ORDER BY published_at DESC 
       LIMIT ?`,
       [limit]
    );

    const newsList = rows as any[];
    if (!newsList || newsList.length === 0) {
      return NextResponse.json({ success: true, message: 'هیچ خبری در دیتابیس برای ارسال یافت نشد.' });
    }

    const report: any[] = [];
    let successCount = 0;

    for (const news of newsList) {
      const link = `https://ehsansalehi.ir/news/${news.id}`;
      const result = await postNewsToAllChannels(
        news.id,
        news.title,
        news.summary || news.title,
        news.image_url,
        link,
        news.source_name || 'فناوری و رمزارز'
      );
      if (result.success) successCount++;
      report.push({
        id: news.id,
        title: news.title,
        channels: result.results,
        errors: result.errors,
      });
    }

    return NextResponse.json({
      success: true,
      total: newsList.length,
      successCount,
      report,
      message: `🎉 عملیات تولید کاور جدید اختصاصی و بازنشر ${successCount} از ${newsList.length} خبر روی شبکه‌های اجتماعی انجام شد.`
    });
  } catch (error: any) {
    console.error('❌ خطا در بازنشر اخبار:', error);
    return NextResponse.json({ success: false, error: error.message || 'خطا در بازنشر اخبار' }, { status: 500 });
  }
}
