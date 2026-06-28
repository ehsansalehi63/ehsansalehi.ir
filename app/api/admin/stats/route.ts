import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: totalPosts } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });

    let totalSales = 0;
    let revenue = 0;

    const { data: salesData } = await supabase.from('user_courses').select('course_id');
    if (salesData && salesData.length > 0) {
      totalSales = salesData.length;
      const courseIds = salesData.map(s => s.course_id);
      const { data: coursesData } = await supabase.from('courses').select('price').in('id', courseIds);
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
        totalSales,
        revenue,
      }
    });
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 });
  }
}
