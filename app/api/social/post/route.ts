import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { getFallbackNews } from '../../../lib/fallbackNews';
import { postNewsToAllChannels } from '../../../lib/socialPoster';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type SocialNewsRow = {
  id: number;
  title: string;
  summary?: string;
  image_url?: string | null;
  source_name?: string | null;
};

async function getPendingNewsRows(): Promise<SocialNewsRow[]> {
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
  return rows as SocialNewsRow[];
}

export async function GET(request: NextRequest) {
  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    const searchParams = request.nextUrl.searchParams;
    const allowStaticFallback = searchParams.get('fallback') === 'true' || searchParams.get('force') === 'true';

    let rows: SocialNewsRow[] = [];
    let source: 'mysql-live' | 'static-fallback' = 'mysql-live';
    let databaseWarning: string | null = null;

    try {
      rows = await getPendingNewsRows();
    } catch (error: any) {
      databaseWarning = typeof error?.code === 'string' ? error.code : 'NEWS_DATABASE_ERROR';
      console.error('[Social post] DB unavailable', { code: databaseWarning });

      if (!allowStaticFallback) {
        return NextResponse.json(
          {
            success: false,
            code: databaseWarning === 'ER_ACCESS_DENIED_ERROR' ? 'DATABASE_AUTH_FAILED' : databaseWarning,
            error: 'دیتابیس برای انتخاب اخبار قابل انتشار در شبکه‌های اجتماعی در دسترس نیست. برای انتشار آرشیو داخلی، fallback=true را اضافه کنید.',
          },
          { status: 503 }
        );
      }

      rows = getFallbackNews({ limit: 3 }).map((item: any) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        image_url: item.image_url,
        source_name: item.source_name,
      }));
      source = 'static-fallback';
    }

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        source,
        databaseWarning,
        message: 'تمام اخبار داغ اخیر قبلاً روی شبکه‌های اجتماعی اصلی منتشر شده‌اند',
      });
    }

    const results = [];
    for (const news of rows) {
      const link = `https://ehsansalehi.ir/news/${news.id}`;
      const result = await postNewsToAllChannels(
        news.id,
        news.title,
        news.summary || news.title,
        news.image_url || null,
        link,
        news.source_name || 'فناوری و رمزارز'
      );
      results.push({ id: news.id, title: news.title, ...result });
    }

    return NextResponse.json({
      success: true,
      source,
      databaseWarning,
      results,
      message: `🎉 تعداد ${results.length} خبر روی شبکه‌های اجتماعی بررسی/منتشر شد`,
    });
  } catch (error: any) {
    console.error('Social post error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
