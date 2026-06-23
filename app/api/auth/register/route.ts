import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/app/lib/models/User';
import { VerificationCodeModel } from '@/app/lib/models/VerificationCode';
import nodemailer from 'nodemailer';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    // بررسی تکراری نبودن ایمیل
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
    }

    // هش کردن رمز عبور
    const hashedPassword = bcrypt.hashSync(password, 10);

    // ایجاد کاربر در دیتابیس MySQL
    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    // ساخت کد تأیید ۶ رقمی
    const code = generateCode();
    await VerificationCodeModel.create(email, code);

    // ارسال ایمیل کد تأیید
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

    return NextResponse.json({
      success: true,
      message: 'کد تأیید به ایمیل شما ارسال شد',
      email,
    });
  } catch (error) {
    console.error('❌ خطا در ثبت نام:', error);
    return NextResponse.json({ error: 'خطا در ثبت نام' }, { status: 500 });
  }
}
