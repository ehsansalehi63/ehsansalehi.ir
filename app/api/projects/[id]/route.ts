import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - دریافت یک پروژه با id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log('📡 API request for project:', params);

  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      console.log('❌ شناسه نامعتبر');
      return NextResponse.json({ error: 'شناسه پروژه نامعتبر است' }, { status: 400 });
    }

    console.log('🔍 Searching for project ID:', id);

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    if (!data) {
      console.log('❌ Project not found');
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }

    console.log('✅ Project found:', data.title);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در دریافت پروژه' }, { status: 500 });
  }
}

// PUT - ویرایش پروژه
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'شناسه پروژه نامعتبر است' }, { status: 400 });
    }

    const body = await request.json();
    const { title, desc, tech, link, image_url } = body;

    if (!title || !desc) {
      return NextResponse.json({ error: 'عنوان و توضیحات الزامی است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ title, desc, tech, link, image_url })
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase error (projects PUT):', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ General error (projects PUT):', error);
    return NextResponse.json({ error: 'خطا در ویرایش پروژه' }, { status: 500 });
  }
}

// DELETE - حذف پروژه
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'شناسه پروژه نامعتبر است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Supabase error (projects DELETE):', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'پروژه حذف شد' });
  } catch (error) {
    console.error('❌ General error (projects DELETE):', error);
    return NextResponse.json({ error: 'خطا در حذف پروژه' }, { status: 500 });
  }
}
