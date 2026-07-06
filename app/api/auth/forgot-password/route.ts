import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'ایمیل الزامی است' },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'کاربری با این ایمیل یافت نشد' },
        { status: 404 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await supabase.from('password_resets').delete().eq('email', email);

    const { error: tokenError } = await supabase
      .from('password_resets')
      .insert([{ email, token, expiresAt: expiresAt.toISOString() }]);

    if (tokenError) {
      console.error('❌ Supabase error (forgot password):', tokenError);
      return NextResponse.json(
        { error: 'خطا در ایجاد لینک بازیابی' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const resetLink = `https://ehsansalehi.ir/auth/reset-password?token=${token}&email=${email}`;

    await transporter.sendMail({
      from: `"احسان صالحی" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'بازیابی رمز عبور',
      html: `
        <div dir="rtl" style="font-family:Tahoma, sans-serif; padding:20px;">
          <h2 style="color:#2563eb;">🔑 بازیابی رمز عبور</h2>
          <p>${user.name} گرامی،</p>
          <p>برای بازنشانی رمز عبور خود، روی لینک زیر کلیک کنید:</p>
          <p style="margin:20px 0;">
            <a href="${resetLink}" style="background:#2563eb; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; display:inline-block;">
              بازنشانی رمز عبور
            </a>
          </p>
          <p style="color:#737373; font-size:14px;">یا لینک زیر را در مرورگر خود کپی کنید:</p>
          <p style="color:#2563eb; word-break:break-all; font-size:12px;">${resetLink}</p>
          <p style="color:#737373; font-size:12px; margin-top:20px;">⏳ این لینک تا ۱ ساعت اعتبار دارد.</p>
          <hr style="margin:20px 0;">
          <p style="color:#737373; font-size:12px;">اگر درخواست بازیابی رمز نداده‌اید، این ایمیل را نادیده بگیرید.</p>
        </div>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'لینک بازیابی به ایمیل شما ارسال شد',
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ General error (forgot password):', error);
    return NextResponse.json(
      { error: 'خطا در ارسال لینک بازیابی' },
      { status: 500 }
    );
  }
}
