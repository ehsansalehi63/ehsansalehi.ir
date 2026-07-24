import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM news_posts');
    return NextResponse.json({ success: true, count: rows[0].count, message: "دیتابیس متصل است" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
