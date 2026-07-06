import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabaseClient';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی است' },
        { status: 400 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, isVerified: false }])
      .select()
      .single();

    if (userError) {
      console.error('❌ Supabase error (register):', userError);
      return NextResponse.json(
        { error: 'خطا در ثبت نام' },
        { status: 500 }
      );
    }

    const code = generateCode();
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert([{ email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() }]);

    if (codeError) {
      console.error('❌ Supabase error (code):', codeError);
      return NextResponse.json(
        { error: 'خطا در ایجاد کد تأیید' },
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
      subject: 'کد تأیید ثبت نام',
      html: `
        <div dir="rtl" style="font-family:Tahoma, sans-serif; padding:20px;">
          <h2>✅ کد تأیید شما</h2>
          <p>${name} گرامی،</p>
          <p>کد تأیید ثبت نام شما:</p>
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
        message: 'کد تأیید به ایمیل شما ارسال شد',
        email,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ General error (register):', error);
    return NextResponse.json(
      { error: 'خطا در ثبت نام' },
      { status: 500 }
    );
  }
}
