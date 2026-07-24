import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/db';
import { translate } from 'node-google-translator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const limit = parseInt(searchParams.get('limit') || '6');

  try {
    let query = `
      SELECT id, title, title_en, summary, summary_en, content, content_en, image_url, source_name, published_at, category, is_published
      FROM news_posts
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Temporary fix: Ignore is_published filter if we imported raw dumps that might be 0 or null
    // We just return everything that looks like a valid news item
    conditions.push('(is_published = 1 OR is_published = 0 OR is_published IS NULL)');

    if (search) {
      conditions.push('(title LIKE ? OR title_en LIKE ? OR summary LIKE ? OR summary_en LIKE ? OR content LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    if (category && category !== 'All' && category !== 'همه') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (sort === 'trending') {
      query += ' ORDER BY id DESC LIMIT ?';
    } else {
      query += ' ORDER BY published_at DESC LIMIT ?';
    }
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    const newsList = rows as any[] || [];

    // Provide default English fallbacks so UI doesn't crash or timeout
    for (const item of newsList) {
      if (!item.title_en) {
        item.title_en = item.title || `Tech Update (${item.source_name || 'IT News'})`;
      }
      if (!item.summary_en) {
        item.summary_en = item.summary ? item.summary.slice(0, 150) + '...' : 'Latest technology and cybersecurity updates from Ehsan Salehi.';
      }
    }

    return NextResponse.json({ success: true, news: newsList });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
