import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import deployInfo from '../../../../public/deploy-info.json';

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

async function checkDatabase() {
  try {
    const [rows] = await pool.execute('SELECT 1 AS ok');
    return { ok: true, sample: Array.isArray(rows) ? (rows as any[])[0] : null };
  } catch (error: any) {
    return {
      ok: false,
      code: typeof error?.code === 'string' ? error.code : 'DATABASE_ERROR',
    };
  }
}

export async function GET(request: NextRequest) {
  const includeDb = request.nextUrl.searchParams.get('db') === '1';

  return NextResponse.json(
    {
      ok: true,
      service: 'ehsansalehi.ir',
      checkedAt: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      node: process.version,
      cwd: process.cwd(),
      deploy: deployInfo,
      ...(includeDb ? { database: await checkDatabase() } : {}),
    },
    { headers: NO_STORE_HEADERS }
  );
}
