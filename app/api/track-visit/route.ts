import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const page = body?.page || '/';

    // Ignore admin and internal api calls
    if (page.startsWith('/admin') || page.startsWith('/api') || page.startsWith('/_next')) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);

    // Ensure table exists
    await pool.execute(`CREATE TABLE IF NOT EXISTS site_visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(100) NOT NULL,
      page VARCHAR(255) NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_page (page)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

    await pool.execute(
      'INSERT INTO site_visits (ip, page, user_agent, created_at) VALUES (?, ?, ?, NOW())',
      [ip.split(',')[0].trim(), page, userAgent]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
