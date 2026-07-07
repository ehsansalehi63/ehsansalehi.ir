import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { translate } from 'node-google-translator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function translateToPersian(text: string): Promise<string> {
  if (!text || text.length < 5) return text;
  try {
    const res = await translate(text, { to: 'fa' });
    return res.text || text;
  } catch {
    return text;
  }
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      "SELECT id, title, content FROM news_posts WHERE content NOT LIKE '%سلام%' AND content NOT LIKE '%در%' LIMIT 20"
    );
    let updated = 0;
    for (const row of rows as any[]) {
      const translatedContent = await translateToPersian(row.content);
      if (translatedContent && translatedContent !== row.content) {
        await pool.execute(
          'UPDATE news_posts SET content = ? WHERE id = ?',
          [translatedContent, row.id]
        );
        updated++;
      }
    }
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
