import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = body?.page || '/';
    const referrer = (body?.referrer || '').slice(0, 500);
    let source = (body?.source || '').toLowerCase();

    // Ignore admin and internal api calls
    if (page.startsWith('/admin') || page.startsWith('/api') || page.startsWith('/_next')) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);

    // Auto-detect source if not explicitly provided
    if (!source || source === 'direct') {
      const lowerRef = referrer.toLowerCase();
      const lowerUa = userAgent.toLowerCase();
      if (lowerRef.includes('linkedin.com') || lowerRef.includes('lnkd.in') || lowerUa.includes('linkedinbot') || page.includes('source=linkedin')) {
        source = 'linkedin';
      } else if (lowerRef.includes('google.com') || lowerRef.includes('google.co') || lowerUa.includes('googlebot') || page.includes('source=google')) {
        source = 'google';
      } else if (lowerRef.includes('t.me') || lowerRef.includes('telegram') || lowerUa.includes('telegrambot') || page.includes('source=telegram')) {
        source = 'telegram';
      } else if (lowerRef.includes('eitaa.com') || page.includes('source=eitaa')) {
        source = 'eitaa';
      } else if (lowerRef.includes('bale.ai') || page.includes('source=bale')) {
        source = 'bale';
      } else if (lowerRef.includes('rubika.ir') || page.includes('source=rubika')) {
        source = 'rubika';
      } else if (referrer && !lowerRef.includes('ehsansalehi.ir')) {
        source = 'external';
      } else {
        source = 'direct';
      }
    }

    // Ensure table exists with all modern columns
    await pool.execute(`CREATE TABLE IF NOT EXISTS site_visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(100) NOT NULL,
      page VARCHAR(255) NOT NULL,
      user_agent TEXT,
      referrer VARCHAR(500) DEFAULT NULL,
      source VARCHAR(50) DEFAULT 'direct',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at),
      INDEX idx_page (page),
      INDEX idx_source (source)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

    // Safely add columns if older table version existed without them
    try {
      await pool.execute('ALTER TABLE site_visits ADD COLUMN referrer VARCHAR(500) DEFAULT NULL');
    } catch {
      // ignore if already exists
    }
    try {
      await pool.execute("ALTER TABLE site_visits ADD COLUMN source VARCHAR(50) DEFAULT 'direct', ADD INDEX idx_source (source)");
    } catch {
      // ignore if already exists
    }

    await pool.execute(
      'INSERT INTO site_visits (ip, page, user_agent, referrer, source, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [ip.split(',')[0].trim(), page, userAgent, referrer || null, source || 'direct']
    );

    return NextResponse.json({ success: true, source });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
