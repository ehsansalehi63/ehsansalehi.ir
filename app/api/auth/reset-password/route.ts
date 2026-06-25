import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' }, { status: 400 });
    }

    // بررسی توکن
    const { data: resetData, error: findError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .gt('expiresAt', new Date().toISOString())
      .maybeSingle();

    if (findError || !resetData) {
      return NextResponse.json({ error: 'لینک نامعتبر یا منقضی شده است' }, { status: 400 });
    }

    // هش کردن رمز جدید
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // به‌روزرسانی رمز کاربر
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email);

    if (updateError) {
      console.error('❌ Supabase error (reset password):', updateError);
      return NextResponse.json({ error: 'خطا در بازنشانی رمز' }, { status: 500 });
    }

    // حذف توکن مصرف‌شده
    await supabase
      .from('password_resets')
      .delete()
      .eq('email', email)
      .eq('token', token);

    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد',
    });
  } catch (error) {
    console.error('❌ General error (reset password):', error);
    return NextResponse.json({ error: 'خطا در بازنشانی رمز' }, { status: 500 });
  }
}
