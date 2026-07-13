import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import { verifyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const [usersRes] = await query<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const [projectsRes] = await query<{ count: number }>('SELECT COUNT(*) as count FROM projects');
    const [postsRes] = await query<{ count: number }>('SELECT COUNT(*) as count FROM blog_posts');

    let totalSales = 0;
    let revenue = 0;

    try {
      const salesData = await query<{ course_id: number }>('SELECT course_id FROM user_courses');
      if (salesData && salesData.length > 0) {
        totalSales = salesData.length;
        const courseIds = salesData.map(s => s.course_id);
        if (courseIds.length > 0) {
          const placeholders = courseIds.map(() => '?').join(',');
          const coursesData = await query<{ price: number }>(`SELECT price FROM courses WHERE id IN (${placeholders})`, courseIds);
          if (coursesData) {
            revenue = coursesData.reduce((sum, c) => sum + (c.price || 0), 0);
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ جداول دوره‌ها هنوز ساخته نشده‌اند یا خالی هستند');
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: usersRes?.count || 0,
        totalProjects: projectsRes?.count || 0,
        totalPosts: postsRes?.count || 0,
        totalSales,
        revenue,
      }
    });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 });
  }
}
