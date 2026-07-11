import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '6');

  try {
    let query = `
      SELECT id, title, summary, image_url, source_name, published_at, category
      FROM news_posts
      WHERE is_published = TRUE
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY published_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return NextResponse.json({ success: true, news: rows });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
