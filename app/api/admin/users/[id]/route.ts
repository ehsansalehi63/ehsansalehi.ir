import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// PUT - تغییر نقش کاربر (ادمین/عادی)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: 'مقدار isAdmin باید boolean باشد' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ isAdmin })
      .eq('id', id)
      .select('id, name, email, isVerified, isAdmin, createdAt');

    if (error) {
      console.error('❌ Supabase error (user PUT):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('❌ General error (user PUT):', error);
    return NextResponse.json({ error: 'خطا در ویرایش کاربر' }, { status: 500 });
  }
}

// DELETE - حذف کاربر
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select('id, name, email');

    if (error) {
      console.error('❌ Supabase error (user DELETE):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'کاربر حذف شد' });
  } catch (error) {
    console.error('❌ General error (user DELETE):', error);
    return NextResponse.json({ error: 'خطا در حذف کاربر' }, { status: 500 });
  }
}
