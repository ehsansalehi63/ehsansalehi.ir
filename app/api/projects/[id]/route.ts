import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('📝 params.id:', params.id);
    const id = Number(params.id);
    console.log('📝 تبدیل شده به عدد:', id);
    
    if (isNaN(id) || id <= 0) {
      console.log('❌ شناسه نامعتبر:', params.id);
      return NextResponse.json({ error: 'شناسه پروژه نامعتبر است' }, { status: 400 });
    }

    const body = await request.json();
    console.log('📝 داده‌های دریافتی برای ویرایش:', body);

    const { title, desc, tech, link, image_url } = body;

    if (!title || !desc) {
      return NextResponse.json({ error: 'عنوان و توضیحات الزامی است' }, { status: 400 });
    }

    const updateData: any = { title, desc };
    if (tech !== undefined) updateData.tech = tech || null;
    if (link !== undefined) updateData.link = link || '#';
    if (image_url !== undefined) updateData.image_url = image_url || null;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در ویرایش پروژه' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'پروژه حذف شد' });
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در حذف پروژه' }, { status: 500 });
  }
}
