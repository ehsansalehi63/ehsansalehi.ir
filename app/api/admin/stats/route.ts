import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // تعداد کاربران
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // تعداد پروژه‌ها
    const { count: totalProjects, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // تعداد پست‌ها
    const { count: totalPosts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });

    // تعداد فروش‌ها (از جدول user_courses)
    const { count: totalSales, error: salesError } = await supabase
      .from('user_courses')
      .select('*', { count: 'exact', head: true });

    // درآمد کل (مجموع قیمت دوره‌های فروخته شده)
    const { data: salesData, error: revenueError } = await supabase
      .from('user_courses')
      .select('course_id');

    let revenue = 0;
    if (salesData && salesData.length > 0) {
      const courseIds = salesData.map(s => s.course_id);
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('price')
        .in('id', courseIds);

      if (coursesData) {
        revenue = coursesData.reduce((sum, c) => sum + (c.price || 0), 0);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalProjects: totalProjects || 0,
        totalPosts: totalPosts || 0,
        totalSales: totalSales || 0,
        revenue,
      }
    });
  } catch (error) {
    console.error('❌ General error (stats):', error);
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 });
  }
}
