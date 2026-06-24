import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface RouteParams {
  params: {
    id: string;
  };
}

// ویرایش پروژه
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'شناسه پروژه نامعتب    }

    const body = await request.json();
    const { title, desc, tech, link } = body;

    if (!title || !desc) {
      return NextResponse.json({ error: 'عنوان و توضیحات الزامی است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ 
        title, 
        desc, 
        tech: tech || null, 
        link: link || null 
      })
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

// حذف پروژه
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10);
    
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
