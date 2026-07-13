import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await query('SELECT * FROM courses ORDER BY createdAt DESC');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ General error (courses GET):', error);
    return NextResponse.json({ error: 'خطا در دریافت دوره‌ها' }, { status: 500 });
  }
}
