import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await pool.execute(
      'SELECT * FROM blog_posts WHERE id = ?',
      [id]
    );

    const post = (rows as any[])[0];
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'پست یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await pool.execute(
      `UPDATE blog_posts 
       SET title = ?, slug = ?, excerpt = ?, content = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [
        body.title,
        body.slug,
        body.excerpt,
        body.content,
        body.image_url,
        body.status,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await pool.execute(
      'DELETE FROM blog_posts WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
