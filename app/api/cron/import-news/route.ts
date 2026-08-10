import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type ColumnRow = { Field: string };

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asIsoDate(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function POST(request: NextRequest) {
  const authError = verifyCron(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const title = cleanString(body?.title);
    const summary = cleanString(body?.summary);
    const content = cleanString(body?.content);

    if (!title || !summary || !content) {
      return NextResponse.json(
        { success: false, error: 'title, summary and content are required' },
        { status: 400 }
      );
    }

    const [columnRows] = await pool.execute('SHOW COLUMNS FROM news_posts');
    const available = new Set((columnRows as ColumnRow[]).map((column) => column.Field));

    const payload: Record<string, any> = {
      title,
      summary,
      content,
      image_url: cleanString(body?.image_url || body?.imageUrl),
      source_name: cleanString(body?.source_name || body?.sourceName, 'Make Import'),
      source_url: cleanString(body?.source_url || body?.sourceUrl || body?.original_url || body?.originalUrl),
      original_url: cleanString(body?.original_url || body?.originalUrl || body?.source_url || body?.sourceUrl),
      published_at: asIsoDate(body?.published_at || body?.publishedAt) || new Date().toISOString().slice(0, 19).replace('T', ' '),
      category: cleanString(body?.category, 'فناوری و رمزارز'),
      is_published: true,
      posted_to_social: body?.posted_to_social
        ? (typeof body.posted_to_social === 'string' ? body.posted_to_social : JSON.stringify(body.posted_to_social))
        : '',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      view_count: 0,
    };

    const columns = Object.keys(payload).filter((column) => available.has(column));
    const placeholders = columns.map(() => '?').join(', ');

    const [result] = await pool.execute(
      `INSERT INTO news_posts (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`,
      columns.map((column) => payload[column])
    );

    const insertId = (result as any)?.insertId || null;

    return NextResponse.json({
      success: true,
      id: insertId,
      message: 'Translated news imported successfully',
      link: insertId ? `https://ehsansalehi.ir/news/${insertId}` : null,
    });
  } catch (error: any) {
    console.error('❌ import-news failed:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
