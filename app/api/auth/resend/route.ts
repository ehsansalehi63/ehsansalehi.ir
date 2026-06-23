import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongoose';
import { User } from '@/app/lib/models/User';
import { VerificationCode } from '@/app/lib/models/VerificationCode';
import nodemailer from 'nodemailer';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'ایمیل الزامی است' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'کاربری با این ایمیل یافت نشد' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'این حساب قبلاً تأیید شده است' }, { status: 400 });
    }

    // حذف کدهای قبلی
    await VerificationCode.deleteMany({ email });

    // ساخت کد جدید
    const code = generateCode();
    await VerificationCode.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // ارسال ایمیل
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
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

    return NextResponse.json({ success: true, message: 'کد جدید ارسال شد' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ارسال مجدد کد' }, { status: 500 });
  }
}
