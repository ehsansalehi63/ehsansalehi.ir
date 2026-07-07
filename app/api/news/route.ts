import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '50';

    let query = 'SELECT * FROM news_posts WHERE is_published = TRUE';
    const params: any[] = [];

    if (search) {
      query += ' AND (title LIKE ? OR content LIKE ? OR summary LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    query += ' ORDER BY published_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      news: rows,
      count: (rows as any[]).length,
    });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در دریافت اخبار',
      },
      { status: 500 }
    );
  }
}
