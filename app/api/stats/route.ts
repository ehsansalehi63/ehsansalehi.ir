import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // این API برای نمایش آمار در پنل ادمین استفاده می‌شود
    const [visitors] = await pool.execute(
      'SELECT COUNT(DISTINCT ip) as total_visitors FROM site_visits WHERE DATE(created_at) = CURDATE()'
    );
    
    const [pageViews] = await pool.execute(
      'SELECT COUNT(*) as total_views FROM site_visits WHERE DATE(created_at) = CURDATE()'
    );

    const [topPages] = await pool.execute(
      'SELECT page, COUNT(*) as views FROM site_visits WHERE DATE(created_at) = CURDATE() GROUP BY page ORDER BY views DESC LIMIT 10'
    );

    return NextResponse.json({
      success: true,
      stats: {
        visitors: (visitors as any[])[0]?.total_visitors || 0,
        pageViews: (pageViews as any[])[0]?.total_views || 0,
        topPages: topPages || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
