import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { translate } from 'node-google-translator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'News ID required' }, { status: 400 });
    }

    // Ensure title_en columns exist
    try {
      await pool.execute('ALTER TABLE news_posts ADD COLUMN title_en TEXT;');
      await pool.execute('ALTER TABLE news_posts ADD COLUMN content_en LONGTEXT;');
      await pool.execute('ALTER TABLE news_posts ADD COLUMN summary_en TEXT;');
    } catch {
      // ignore if exists
    }

    const [rows] = await pool.execute('SELECT * FROM news_posts WHERE id = ?', [id]);
    const news = (rows as any[])[0];
    if (!news) {
      return NextResponse.json({ success: false, error: 'News not found' }, { status: 404 });
    }

    if (news.title_en && news.content_en) {
      return NextResponse.json({
        success: true,
        title_en: news.title_en,
        summary_en: news.summary_en,
        content_en: news.content_en,
      });
    }

    // Translate on the fly to English
    let title_en = news.title;
    let content_en = news.content;
    let summary_en = news.summary;

    try {
      const resT = await translate(news.title, { to: 'en' });
      if (resT && resT.text) title_en = resT.text;

      const resC = await translate((news.content || '').slice(0, 3000), { to: 'en' });
      if (resC && resC.text) content_en = resC.text;

      const resS = await translate((news.summary || news.content || '').slice(0, 400), { to: 'en' });
      if (resS && resS.text) summary_en = resS.text;

      await pool.execute(
        'UPDATE news_posts SET title_en = ?, content_en = ?, summary_en = ? WHERE id = ?',
        [title_en, content_en, summary_en, id]
      );
    } catch (e: any) {
      console.warn('⚠️ Error translating news to English:', e);
    }

    return NextResponse.json({
      success: true,
      title_en,
      summary_en,
      content_en,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
