import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در دریافت پروژه‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, desc, tech, link, image_url } = body;

    if (!title || !desc) {
      return NextResponse.json({ error: 'عنوان و توضیحات الزامی است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ title, desc, tech, link, image_url }])
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد پروژه' }, { status: 500 });
  }
}
