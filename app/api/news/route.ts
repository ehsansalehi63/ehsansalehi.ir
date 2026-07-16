import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/db';
import { translate } from 'node-google-translator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '6');

  try {
    // Ensure English columns exist
    try {
      await pool.execute('ALTER TABLE news_posts ADD COLUMN title_en TEXT;');
      await pool.execute('ALTER TABLE news_posts ADD COLUMN summary_en TEXT;');
      await pool.execute('ALTER TABLE news_posts ADD COLUMN content_en LONGTEXT;');
    } catch {
      // ignore
    }

    let query = `
      SELECT id, title, title_en, summary, summary_en, content, content_en, image_url, source_name, published_at, category
      FROM news_posts
      WHERE is_published = TRUE
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (title LIKE ? OR title_en LIKE ? OR summary LIKE ? OR summary_en LIKE ? OR content LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    if (category && category !== 'All' && category !== 'همه') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY published_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    const newsList = rows as any[] || [];

    // اگر آیتمی دارای title_en یا summary_en نیست، در لحظه ترجمه و در دیتابیس ذخیره شود
    for (const item of newsList) {
      if (!item.title_en || /[آ-ی]/.test(item.title_en)) {
        try {
          const resT = await translate(item.title, { to: 'en' });
          const resS = await translate((item.summary || item.content || '').slice(0, 350), { to: 'en' });
          if (resT && resT.text) {
            item.title_en = resT.text;
            item.summary_en = resS?.text || (item.summary || '').slice(0, 300);
            await pool.execute(
              'UPDATE news_posts SET title_en = ?, summary_en = ? WHERE id = ?',
              [item.title_en, item.summary_en, item.id]
            );
          }
        } catch {
          // fallback if translate fails
          item.title_en = item.title_en || `Global Tech & Crypto Update (${item.source_name || 'IT News'})`;
          item.summary_en = item.summary_en || 'Comprehensive AI analysis and translation of global breaking technology and cryptocurrency news.';
        }
      } else if (!item.summary_en || /[آ-ی]/.test(item.summary_en)) {
        item.summary_en = 'Comprehensive AI analysis and translation of global breaking technology and cryptocurrency news.';
      }
    }

    return NextResponse.json({ success: true, news: newsList });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
