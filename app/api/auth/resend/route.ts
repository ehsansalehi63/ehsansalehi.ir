import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabaseClient';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'کاربری با این ایمیل یافت نشد' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'این حساب قبلاً تأیید شده است' },
        { status: 400 }
      );
    }

    await supabase.from('verification_codes').delete().eq('email', email);

    const code = generateCode();
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert([{ email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() }]);

    if (codeError) {
      console.error('❌ Supabase error (resend):', codeError);
      return NextResponse.json(
        { error: 'خطا در ایجاد کد جدید' },
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

    await transporter.sendMail({
      from: `"احسان صالحی" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'کد تأیید جدید',
      html: `
        <div dir="rtl" style="font-family:Tahoma, sans-serif; padding:20px;">
          <h2>✅ کد تأیید جدید شما</h2>
          <p>${user.name} گرامی،</p>
          <p>کد تأیید جدید شما:</p>
          <h1 style="font-size:32px; color:#2563eb; letter-spacing:4px;">${code}</h1>
          <p>این کد تا ۱۰ دقیقه اعتبار دارد.</p>
          <hr>
          <p style="color:#737373; font-size:12px;">این ایمیل به صورت خودکار ارسال شده است.</p>
        </div>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'کد جدید به ایمیل شما ارسال شد',
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('❌ General error (resend):', error);
    return NextResponse.json(
      { error: 'خطا در ارسال مجدد کد' },
      { status: 500 }
    );
  }
}
