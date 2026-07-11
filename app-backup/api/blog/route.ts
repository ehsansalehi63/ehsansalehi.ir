import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/mysql';

export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM blog_posts WHERE status = "published" ORDER BY created_at DESC LIMIT 10'
    );
    return NextResponse.json({
      success: true,
      posts: rows,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'خطای ناشناخته',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [result] = await pool.execute(
      `INSERT INTO blog_posts 
       (title, slug, excerpt, content, image_url, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.title,
        body.slug,
        body.excerpt,
        body.content,
        body.image_url,
        body.status || 'draft'
      ]
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'خطای ناشناخته',
    }, { status: 500 });
  }
}
