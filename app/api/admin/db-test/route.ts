import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '../../../lib/auth';
import { getDatabaseEnvDiagnostics, pool } from '../../../lib/db';

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

type ColumnRow = {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: unknown;
  Extra: string;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

async function authorize(request: NextRequest): Promise<NextResponse | null> {
  const authorization = request.headers.get('authorization') || '';
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const diagnosticsSecret = process.env.DB_DIAGNOSTICS_SECRET || process.env.CRON_SECRET;

  if (diagnosticsSecret && bearer && safeEqual(bearer, diagnosticsSecret)) return null;
  return verifyAdmin(request);
}

function databaseError(error: any) {
  return {
    code: typeof error?.code === 'string' ? error.code : 'UNKNOWN_DATABASE_ERROR',
    errno: typeof error?.errno === 'number' ? error.errno : null,
    sqlState: typeof error?.sqlState === 'string' ? error.sqlState : null,
    message: error instanceof Error ? error.message : String(error),
  };
}

export async function GET(request: NextRequest) {
  const authError = await authorize(request);
  if (authError) return authError;

  const environment = getDatabaseEnvDiagnostics();

  try {
    const [serverRows] = await pool.execute(`
      SELECT
        DATABASE() AS database_name,
        CURRENT_USER() AS authenticated_user,
        VERSION() AS server_version,
        NOW() AS server_time
    `);
    const server = (serverRows as any[])[0] || {};

    const [columnRows] = await pool.execute('SHOW COLUMNS FROM news_posts');
    const columns = columnRows as ColumnRow[];
    const available = new Set(columns.map((column) => column.Field));

    const aggregateFields = ['COUNT(*) AS total'];
    if (available.has('id')) {
      aggregateFields.push('MIN(`id`) AS oldest_id', 'MAX(`id`) AS newest_id');
    }
    if (available.has('published_at')) {
      aggregateFields.push('MAX(`published_at`) AS newest_published_at');
    }
    if (available.has('is_published')) {
      aggregateFields.push(
        'SUM(`is_published` = 1) AS published',
        'SUM(`is_published` = 0) AS unpublished',
        'SUM(`is_published` IS NULL) AS publication_state_null'
      );
    }

    const [aggregateRows] = await pool.execute(`SELECT ${aggregateFields.join(', ')} FROM news_posts`);
    const counts = (aggregateRows as any[])[0] || {};

    const sampleColumns = ['id', 'title', 'published_at', 'is_published']
      .filter((column) => available.has(column));
    let sample: any[] = [];
    if (sampleColumns.length > 0) {
      const orderColumn = available.has('id') ? '`id`' : `\`${sampleColumns[0]}\``;
      const [sampleRows] = await pool.execute(
        `SELECT ${sampleColumns.map((column) => `\`${column}\``).join(', ')} FROM news_posts ORDER BY ${orderColumn} DESC LIMIT 3`
      );
      sample = sampleRows as any[];
    }

    return json({
      success: true,
      checkedAt: new Date().toISOString(),
      connection: {
        database: server.database_name,
        authenticatedUser: server.authenticated_user,
        serverVersion: server.server_version,
        serverTime: server.server_time,
        credentialSource: getDatabaseEnvDiagnostics().activeCredentialSource,
      },
      environment: getDatabaseEnvDiagnostics(),
      news: {
        counts,
        columns,
        optionalColumnsMissing: ['title_en', 'summary_en', 'content_en', 'category']
          .filter((column) => !available.has(column)),
        sample,
      },
      message: 'اتصال دیتابیس و جدول اخبار سالم است.',
    });
  } catch (error: any) {
    const details = databaseError(error);
    console.error('[DB diagnostics]', details);

    return json({
      success: false,
      checkedAt: new Date().toISOString(),
      stage: details.code === 'ER_ACCESS_DENIED_ERROR' ? 'authentication' : 'connection-or-schema',
      environment,
      error: details,
      requiredAction: details.code === 'ER_ACCESS_DENIED_ERROR'
        ? 'رمز کاربر MySQL را در cPanel بازنشانی، کاربر را با ALL PRIVILEGES به دیتابیس متصل، Env را یکسان و Node.js App را Restart کنید.'
        : 'تنظیمات Env و ساختار جدول news_posts را بررسی کنید.',
    }, 503);
  }
}
