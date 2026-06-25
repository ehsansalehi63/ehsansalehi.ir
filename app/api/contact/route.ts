import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی است' },
        { status: 400 }
      );
    }

    const { error: dbError } = await supabase
      .from('messages')
      .insert([{ name, email, message }]);

    if (dbError) {
      console.error('❌ Supabase error:', dbError);
      return NextResponse.json(
        { error: 'خطا در ذخیره پیام' },
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
      from: `"فرم تماس سایت" <${process.env.SMTP_USER}>`,
      to: 'info@ehsansalehi.ir',
      subject: `تماس جدید از ${name}`,
      replyTo: email,
      html: `
        <div dir="rtl" style="font-family:Tahoma, sans-serif; padding:20px;">
          <h2 style="color:#2563eb;">📩 پیام جدید</h2>
          <p><strong>نام:</strong> ${name}</p>
          <p><strong>ایمیل:</strong> ${email}</p>
          <p><strong>پیام:</strong><br/>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });

    // هدر Cache-Control برای پاسخ
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال پیام' },
      { status: 500 }
    );
  }
}
