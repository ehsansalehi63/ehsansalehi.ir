import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    // هش کردن رمز عبور
    const hashedPassword = bcrypt.hashSync(password, 10);

    // ذخیره در Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, isVerified: false }])
      .select();

    if (error) {
      console.error('❌ Supabase error (register):', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    // (اختیاری) ارسال کد تأیید با Resend یا Web3Forms
    // فعلاً فقط ثبت‌نام را تست می‌کنیم

    return NextResponse.json({ success: true, user: data[0] });
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در ثبت نام' }, { status: 500 });
  }
}
