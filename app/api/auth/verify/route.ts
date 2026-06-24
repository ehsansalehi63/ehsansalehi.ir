import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabaseClient';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'ایمیل و کد الزامی است' }, { status: 400 });
    }

    // پیدا کردن کد در Supabase
    const { data: codes, error: findError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gte('expiresAt', new Date().toISOString());

    if (findError) {
      console.error('❌ Supabase error (verify):', findError);
      return NextResponse.json({ error: `Supabase error: ${findError.message}` }, { status: 500 });
    }

    if (!codes || codes.length === 0) {
      return NextResponse.json({ error: 'کد نامعتبر یا منقضی شده است' }, { status: 400 });
    }

    // فعال‌سازی کاربر
    const { error: updateError } = await supabase
      .from('users')
      .update({ isVerified: true })
      .eq('email', email);

    if (updateError) {
      console.error('❌ Supabase error (verify update):', updateError);
      return NextResponse.json({ error: `Supabase error: ${updateError.message}` }, { status: 500 });
    }

    // حذف کدهای مصرف‌شده
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email);

    // دریافت اطلاعات کاربر
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const user = users[0];

    // ساخت توکن JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'حساب شما با موفقیت تأیید شد',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    console.error('❌ General error (verify):', error);
    return NextResponse.json({ error: 'خطا در تأیید کد' }, { status: 500 });
  }
}
