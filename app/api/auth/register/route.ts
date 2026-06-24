import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { UserModel } from '@/app/lib/models/User';
import { VerificationCodeModel } from '@/app/lib/models/VerificationCode';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await UserModel.create({ name, email, password: hashedPassword, isVerified: false });

    const code = generateCode();
    await VerificationCodeModel.create(email, code);

    const { error } = await resend.emails.send({
      from: `"احسان صالحی" <noreply@ehsansalehi.ir>`,
      to: [email],
      subject: 'کد تأیید ثبت نام',
      html: `<div dir="rtl"><h2>✅ کد تأیید شما</h2><p>${name} گرامی،</p><p>کد تأیید: <strong>${code}</strong></p><p>این کد تا ۱۰ دقیقه اعتبار دارد.</p></div>`,
    });

    if (error) {
      console.error('خطا در ارسال ایمیل:', error);
      return NextResponse.json({ error: 'خطا در ارسال کد تأیید' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'کد تأیید به ایمیل شما ارسال شد', email });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ثبت نام' }, { status: 500 });
  }
}
