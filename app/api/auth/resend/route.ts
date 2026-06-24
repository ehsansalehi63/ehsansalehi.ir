import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { UserModel } from '@/app/lib/models/User';
import { VerificationCodeModel } from '@/app/lib/models/VerificationCode';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'ایمیل الزامی است' }, { status: 400 });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'کاربری با این ایمیل یافت نشد' }, { status: 404 });
    }
    if (user.isVerified) {
      return NextResponse.json({ error: 'این حساب قبلاً تأیید شده است' }, { status: 400 });
    }

    await VerificationCodeModel.deleteByEmail(email);
    const code = generateCode();
    await VerificationCodeModel.create(email, code);

    const { error } = await resend.emails.send({
      from: `"احسان صالحی" <noreply@ehsansalehi.ir>`,
      to: [email],
      subject: 'کد تأیید جدید',
      html: `<div dir="rtl"><h2>✅ کد تأیید جدید</h2><p>${user.name} گرامی،</p><p>کد جدید: <strong>${code}</strong></p><p>این کد تا ۱۰ دقیقه اعتبار دارد.</p></div>`,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'خطا در ارسال مجدد کد' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'کد جدید به ایمیل شما ارسال شد' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ارسال مجدد کد' }, { status: 500 });
  }
}
