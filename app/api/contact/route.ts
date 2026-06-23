import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { connectToDatabase } from '@/app/lib/mongoose';
import { Message } from '@/app/lib/models/Message';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();
    console.log('📝 درخواست تماس:', { name, email });

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    console.log('🔄 اتصال به دیتابیس...');
    await connectToDatabase();
    await Message.create({ name, email, message });
    console.log('✅ پیام در دیتابیس ذخیره شد');

    // ارسال ایمیل
    console.log('📧 ارسال ایمیل به مدیر...');
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
        <div dir="rtl" style="font-family:Tahoma, sans-serif;">
          <h2 style="color:#2563eb;">📩 پیام جدید</h2>
          <p><strong>نام:</strong> ${name}</p>
          <p><strong>ایمیل:</strong> ${email}</p>
          <p><strong>پیام:</strong><br/>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });
    console.log('✅ ایمیل ارسال شد');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ خطا در ارسال پیام:', error);
    return NextResponse.json({
      error: error.message || 'خطا در ارسال پیام',
      stack: error.stack,
    }, { status: 500 });
  }
}
