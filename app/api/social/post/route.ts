import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { getFallbackNews } from '../../../lib/fallbackNews';
import { postNewsToAllChannels } from '../../../lib/socialPoster';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type ColumnRow = { Field: string };
type SocialNewsRow = {
  id: number;
  title: string;
  summary?: string;
  image_url?: string | null;
  source_name?: string | null;
};

async function getPendingNewsRows(limit: number): Promise<SocialNewsRow[]> {
  const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.floor(limit) : 2, 1), 10);
  const queryLimit = Math.min(Math.max(safeLimit * 5, safeLimit), 50);
  const [columnRows] = await pool.execute('SHOW COLUMNS FROM news_posts');
  const available = new Set((columnRows as ColumnRow[]).map((column) => column.Field));

  if (!available.has('id') || !available.has('title')) {
    throw Object.assign(new Error('news_posts is missing required id/title columns'), { code: 'NEWS_SCHEMA_INVALID' });
  }

  const selectedColumns = ['id', 'title', 'summary', 'image_url', 'source_name']
    .filter((column) => available.has(column));
  const conditions: string[] = [];

  if (available.has('is_published')) {
    conditions.push('`is_published` = TRUE');
  }

  if (available.has('posted_to_social')) {
    conditions.push(`(
      posted_to_social IS NULL
      OR posted_to_social = ''
      OR posted_to_social NOT LIKE '%"telegram":true%'
      OR posted_to_social NOT LIKE '%"linkedin":true%'
      OR posted_to_social NOT LIKE '%"eitaa":true%'
      OR posted_to_social NOT LIKE '%"bale":true%'
    )`);
  }

  const orderBy = available.has('published_at')
    ? '`published_at` IS NULL ASC, `published_at` DESC, `id` DESC'
    : '`id` DESC';

  const [rows] = await pool.execute(
    `SELECT ${selectedColumns.map((column) => `\`${column}\``).join(', ')}
     FROM news_posts
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY ${orderBy}
     LIMIT ${queryLimit}`
  );

  return (rows as any[]).map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary || row.title,
    image_url: row.image_url || null,
    source_name: row.source_name || 'فناوری و رمزارز',
  }));
}

export async function GET(request: NextRequest) {
  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    const searchParams = request.nextUrl.searchParams;
    const allowStaticFallback = searchParams.get('fallback') === 'true' || searchParams.get('force') === 'true';
    const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '2', 10) || 2, 1), 10);

    let rows: SocialNewsRow[] = [];
    let source: 'mysql-live' | 'static-fallback' = 'mysql-live';
    let databaseWarning: string | null = null;

    try {
      rows = await getPendingNewsRows(limit);
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

      rows = getFallbackNews({ limit }).map((item: any) => ({
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
      if (results.length >= limit) break;
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

    const publishedCount = results.filter((item) => item.success).length;
    const skippedCount = results.filter((item) => !item.success).length;

    return NextResponse.json({
      success: true,
      source,
      databaseWarning,
      scannedRows: rows.length,
      requestedLimit: limit,
      publishedCount,
      skippedCount,
      results,
      message: `🎉 ${publishedCount} خبر منتشر/بررسی شد و ${skippedCount} مورد اسکیپ یا ناموفق بود`,
    });
  } catch (error: any) {
    console.error('Social post error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
