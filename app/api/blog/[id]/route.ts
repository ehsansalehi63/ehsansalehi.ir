import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// PUT - ویرایش پست
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const body = await request.json();
    const { title, slug, excerpt, content, image_url, status } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'عنوان، اسلاگ و محتوا الزامی است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update({ title, slug, excerpt, content, image_url, status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase error (blog PUT):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'پست یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ General error (blog PUT):', error);
    return NextResponse.json({ error: 'خطا در ویرایش پست' }, { status: 500 });
  }
}

// DELETE - حذف پست
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase error (blog DELETE):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'پست یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'پست حذف شد' });
  } catch (error) {
    console.error('❌ General error (blog DELETE):', error);
    return NextResponse.json({ error: 'خطا در حذف پست' }, { status: 500 });
  }
}
