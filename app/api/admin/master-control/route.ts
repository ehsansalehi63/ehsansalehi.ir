import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'EhsanAdmin123';
    
    if (!authHeader || !authHeader.startsWith(`Bearer ${cronSecret}`)) {
      return NextResponse.json({ success: false, error: 'Unauthorized Master Control' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'sql') {
      const query = body.query;
      const [rows] = await pool.execute(query);
      return NextResponse.json({ success: true, result: rows });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
