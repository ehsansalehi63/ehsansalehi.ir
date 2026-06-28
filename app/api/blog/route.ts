import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - دریافت لیست پست‌ها
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error (blog GET):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ General error (blog GET):', error);
    return NextResponse.json({ error: 'خطا در دریافت پست‌ها' }, { status: 500 });
  }
}

// POST - ایجاد پست جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, image_url, status } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'عنوان، اسلاگ و محتوا الزامی است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{ title, slug, excerpt, content, image_url, status: status || 'draft' }])
      .select();

    if (error) {
      console.error('❌ Supabase error (blog POST):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ General error (blog POST):', error);
    return NextResponse.json({ error: 'خطا در ایجاد پست' }, { status: 500 });
  }
}
