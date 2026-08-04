import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { verifyCron } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/cron/reel
 * Receives reel data from the Base44 workflow and inserts it into the news_posts table.
 * This makes the reel appear on the website's news feed alongside regular news.
 *
 * Authentication: Bearer token (CRON_SECRET or admin token)
 * Body: { title, summary, image_url, video_url?, source_name?, category? }
 */
export async function POST(request: NextRequest) {
  // Verify auth
  const authError = verifyCron(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { title, summary, image_url, video_url, source_name, category } = body;

    if (!title || !summary) {
      return NextResponse.json(
        { error: 'title and summary are required' },
        { status: 400 }
      );
    }

    // Discover available columns dynamically
    const [columnRows] = await pool.execute('SHOW COLUMNS FROM news_posts');
    const available = new Set((columnRows as { Field: string }[]).map((c) => c.Field));

    // Build INSERT dynamically based on available columns
    const fields: string[] = ['title', 'summary'];
    const values: (string | null)[] = [title, summary];

    if (available.has('image_url')) {
      fields.push('image_url');
      values.push(image_url || null);
    }
    if (available.has('video_url') && video_url) {
      fields.push('video_url');
      values.push(video_url);
    }
    if (available.has('source_name')) {
      fields.push('source_name');
      values.push(source_name || 'Reel AI');
    }
    if (available.has('category')) {
      fields.push('category');
      values.push(category || 'ریل ویدیویی');
    }
    if (available.has('is_published')) {
      fields.push('is_published');
      values.push('1' as any);
    }
    if (available.has('posted_to_social')) {
      fields.push('posted_to_social');
      values.push('instagram,linkedin' as any);
    }

    const placeholders = fields.map(() => '?').join(', ');
    const fieldNames = fields.map((f) => `\`${f}\``).join(', ');

    const [result] = await pool.execute(
      `INSERT INTO news_posts (${fieldNames}) VALUES (${placeholders})`,
      values
    );

    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      id: insertId,
      message: 'Reel saved to website news feed',
    });
  } catch (error: any) {
    console.error('❌ Error saving reel:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
