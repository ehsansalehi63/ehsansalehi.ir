import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/app/lib/mongoose';
import { User } from '@/app/lib/models/User';
import { VerificationCode } from '@/app/lib/models/VerificationCode';
import nodemailer from 'nodemailer';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    console.log('📝 درخواست ثبت نام:', { name, email });

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    console.log('🔄 اتصال به دیتابیس...');
    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });
    console.log('✅ کاربر ساخته شد:', user._id);

    const code = generateCode();
    await VerificationCode.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    console.log('✅ کد تأیید ساخته شد:', code);

    // ارسال ایمیل
    console.log('📧 ارسال ایمیل به:', email);
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
    console.log('✅ ایمیل ارسال شد');

    return NextResponse.json({
      success: true,
      message: 'کد تأیید به ایمیل شما ارسال شد',
      email: email,
    });
  } catch (error: any) {
    console.error('❌ خطا در ثبت نام:', error);
    return NextResponse.json({
      error: error.message || 'خطا در ثبت نام',
      stack: error.stack,
    }, { status: 500 });
  }
}
