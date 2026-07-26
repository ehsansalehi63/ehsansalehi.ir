import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/db';
import { getFallbackNews, isDatabaseAuthError } from '../../lib/fallbackNews';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Surrogate-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

const LIST_COLUMNS = [
  'id',
  'title',
  'title_en',
  'summary',
  'summary_en',
  'image_url',
  'source_name',
  'published_at',
  'created_at',
  'category',
] as const;

const CONTENT_COLUMNS = ['content', 'content_en'] as const;
const SEARCH_COLUMNS = ['title', 'title_en', 'summary', 'summary_en', 'content', 'content_en'] as const;

type ColumnRow = { Field: string };
type NewsRow = Record<string, any>;

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, ...extraHeaders },
  });
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || '6', 10);
  if (!Number.isFinite(parsed)) return 6;
  return Math.min(Math.max(parsed, 1), 100);
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = (searchParams.get('q') || '').trim().slice(0, 200);
  const category = (searchParams.get('category') || '').trim().slice(0, 100);
  const sort = searchParams.get('sort') || '';
  const includeContent = searchParams.get('includeContent') === '1';
  const limit = parseLimit(searchParams.get('limit'));

  try {
    // The imported Hostinger dump may not contain newer bilingual columns. Build the
    // projection from the real schema so one absent optional column cannot blank the site.
    const [columnRows] = await pool.execute('SHOW COLUMNS FROM news_posts');
    const availableColumns = new Set((columnRows as ColumnRow[]).map((column) => column.Field));

    if (!availableColumns.has('id') || !availableColumns.has('title')) {
      throw Object.assign(new Error('news_posts is missing required id/title columns'), {
        code: 'NEWS_SCHEMA_INVALID',
      });
    }

    const requestedColumns = includeContent ? [...LIST_COLUMNS, ...CONTENT_COLUMNS] : [...LIST_COLUMNS];
    const selectedColumns = requestedColumns.filter((column) => availableColumns.has(column));
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      const searchableColumns = SEARCH_COLUMNS.filter((column) => availableColumns.has(column));
      if (searchableColumns.length > 0) {
        conditions.push(`(${searchableColumns.map((column) => `\`${column}\` LIKE ?`).join(' OR ')})`);
        const like = `%${search}%`;
        params.push(...searchableColumns.map(() => like));
      }
    }

    if (category && category !== 'All' && category !== 'همه' && availableColumns.has('category')) {
      conditions.push('`category` = ?');
      params.push(category);
    }

    let sql = `SELECT ${selectedColumns.map((column) => `\`${column}\``).join(', ')} FROM news_posts`;
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;

    if (sort === 'trending' || !availableColumns.has('published_at')) {
      sql += ' ORDER BY `id` DESC';
    } else {
      sql += ' ORDER BY `published_at` IS NULL ASC, `published_at` DESC, `id` DESC';
    }

    // limit is strictly clamped to an integer above. Inlining avoids MariaDB/cPanel
    // versions that reject a bound parameter in LIMIT for prepared statements.
    sql += ` LIMIT ${limit}`;

    const [rows] = await pool.execute(sql, params);
    const newsList = (rows as NewsRow[]).map((item) => ({
      id: item.id,
      title: item.title || 'بدون عنوان',
      title_en: item.title_en || item.title || 'News Update',
      summary: item.summary || '',
      summary_en: item.summary_en || (item.summary ? `${String(item.summary).slice(0, 150)}...` : 'Latest technology update.'),
      ...(includeContent ? { content: item.content || '', content_en: item.content_en || '' } : {}),
      image_url: item.image_url || null,
      source_name: item.source_name || null,
      published_at: item.published_at || item.created_at || null,
      category: item.category || null,
    }));

    if (newsList.length === 0) {
      const fallbackNews = getFallbackNews({ limit, search, category, sort, includeContent });
      return json(
        {
          success: true,
          source: 'static-fallback',
          warning: 'NEWS_TABLE_EMPTY',
          count: fallbackNews.length,
          news: fallbackNews,
        },
        200,
        {
          'X-News-Source': 'static-fallback',
          'X-News-Count': String(fallbackNews.length),
          'X-Database-Status': 'empty',
        }
      );
    }

    return json(
      { success: true, source: 'mysql-live', count: newsList.length, news: newsList },
      200,
      { 'X-News-Source': 'mysql-live', 'X-News-Count': String(newsList.length), 'X-Database-Status': 'ok' }
    );
  } catch (error: any) {
    const requestId = randomUUID();
    console.error(`[News API ${requestId}]`, {
      code: errorCode(error),
      message: error instanceof Error ? error.message : String(error),
    });

    const code = errorCode(error);
    const isAuthenticationError = isDatabaseAuthError(error);
    const fallbackNews = getFallbackNews({ limit, search, category, sort, includeContent });
    const debug = searchParams.get('debug') === '1';

    // Public news must keep the site alive even when cPanel MySQL credentials are
    // temporarily wrong. The authenticated /api/admin/db-test endpoint still reports
    // the real database failure, but visitors receive the built-in news archive.
    return json(
      {
        success: true,
        source: 'static-fallback',
        warning: isAuthenticationError ? 'DATABASE_AUTH_FAILED' : 'NEWS_DATABASE_ERROR',
        count: fallbackNews.length,
        news: fallbackNews,
        ...(debug
          ? {
              diagnostics: {
                requestId,
                databaseCode: code || 'UNKNOWN_DATABASE_ERROR',
                message: isAuthenticationError
                  ? 'MySQL authentication failed on cPanel. Reset the MySQL user password or fix user privileges.'
                  : 'MySQL query failed. Check /api/admin/db-test with admin authentication.',
              },
            }
          : {}),
      },
      200,
      {
        'X-News-Source': 'static-fallback',
        'X-News-Count': String(fallbackNews.length),
        'X-Database-Status': isAuthenticationError ? 'auth-failed' : 'error',
        'X-Request-Id': requestId,
      }
    );
  }
}
