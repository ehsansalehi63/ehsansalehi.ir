import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM news_posts WHERE is_published = TRUE ORDER BY published_at DESC LIMIT 6'
    );
    return NextResponse.json({
      success: true,
      news: rows,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'خطا در دریافت اخبار',
    }, { status: 500 });
  }
}
