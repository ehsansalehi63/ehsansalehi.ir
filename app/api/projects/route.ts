import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// دریافت لیست export async function GET() {پروژه
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Supabase error (projects GET):', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ General error (projects GET):', error);
    return NextResponse.json({ error: 'خطا در دریافت پروژه‌ها' }, { status: 500 });
  }
}

// اضافه کردن پروژه جدید
export async function POST(request: Request) {
  try {
    const { title, desc, tech, link } = await request.json();

    if (!title || !desc) {
      return NextResponse.json({ error: 'عنوان و توضیحات الزامی است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ title, desc, tech, link }])
      .select();

    if (error) {
      console.error('❌ Supabase error (projects POST):', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ General error (projects POST):', error);
    return NextResponse.json({ error: 'خطا در ایجاد پروژه' }, { status: 500 });
  }
}
