import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/app/lib/models/User';
import { VerificationCodeModel } from '@/app/lib/models/VerificationCode';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'ایمیل و کد الزامی است' }, { status: 400 });
    }

    // بررسی اعتبار کد در دیتابیس MySQL
    const verification = await VerificationCodeModel.findValid(email, code);
    if (!verification) {
      return NextResponse.json({ error: 'کد نامعتبر یا منقضی شده است' }, { status: 400 });
    }

    // فعال‌سازی کاربر
    await UserModel.verify(email);

    // حذف کد از دیتابیس (استفاده یکبار مصرف)
    await VerificationCodeModel.deleteByEmail(email);

    // دریافت اطلاعات کاربر برای ساخت توکن
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // ساخت توکن JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'حساب شما با موفقیت تأیید شد',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    console.error('❌ خطا در تأیید کد:', error);
    return NextResponse.json({ error: 'خطا در تأیید کد' }, { status: 500 });
  }
}
