import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { translate } from 'deeplx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // انتخاب ۵۰ خبر اول که هنوز فارسی نیستند
    const [rows] = await pool.execute(
      'SELECT id, title, content FROM news_posts WHERE content NOT LIKE "%سلام%" AND content NOT LIKE "%در%" LIMIT 50'
    );
    
    let updated = 0;
    for (const row of rows as any[]) {
      try {
        const translatedTitle = await translate({ text: row.title, source: 'en', target: 'fa' });
        const translatedContent = await translate({ text: row.content, source: 'en', target: 'fa' });
        
        await pool.execute(
          'UPDATE news_posts SET title = ?, content = ? WHERE id = ?',
          [translatedTitle || row.title, translatedContent || row.content, row.id]
        );
        updated++;
      } catch {
        continue;
      }
    }
    
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
