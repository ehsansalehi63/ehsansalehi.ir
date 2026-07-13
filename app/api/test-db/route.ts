import { NextResponse } from 'next/server';
import { pool } from '../../lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.execute('SELECT 1 as result');
    return NextResponse.json({ success: true, message: '✅ اتصال به دیتابیس برقرار است', data: rows });
  } catch (error: any) {
    console.error('❌ خطا در اتصال به دیتابیس:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا' }, { status: 500 });
  }
}
