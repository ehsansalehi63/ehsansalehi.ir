import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongoose';
import { User } from '@/app/lib/models/User';
import { VerificationCode } from '@/app/lib/models/VerificationCode';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'ایمیل و کد الزامی است' }, { status: 400 });
    }

    await connectToDatabase();

    // پیدا کردن کد در دیتابیس
    const verification = await VerificationCode.findOne({ email, code });
    if (!verification) {
      return NextResponse.json({ error: 'کد نامعتبر است' }, { status: 400 });
    }

    // بررسی انقضای کد
    if (new Date() > verification.expiresAt) {
      await VerificationCode.deleteOne({ _id: verification._id });
      return NextResponse.json({ error: 'کد منقضی شده است' }, { status: 400 });
    }

    // فعال‌سازی کاربر
    await User.findOneAndUpdate({ email }, { isVerified: true });
    await VerificationCode.deleteOne({ _id: verification._id });

    // ساخت توکن JWT
    const user = await User.findOne({ email });
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'حساب شما با موفقیت تأیید شد',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در تأیید کد' }, { status: 500 });
  }
}
