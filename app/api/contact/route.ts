import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    // ذخیره در Supabase
    const { error } = await supabase
      .from('messages')
      .insert([{ name, email, message }]);

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: 'خطا در ذخیره پیام' }, { status: 500 });
    }

    // (اختیاری) ارسال ایمیل با Resend یا Web3Forms
    // فعلاً فقط ذخیره در دیتابیس رو تست می‌کنیم

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در ارسال پیام' }, { status: 500 });
  }
}
