import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/lib/models/User';
import { VerificationCodeModel } from '@/lib/models/VerificationCode';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'ایمیل و کد الزامی است' },
        { status: 400 }
      );
    }

    const verification = await VerificationCodeModel.getByEmailAndCode(email, code);

    if (!verification) {
      return NextResponse.json(
        { error: 'کد نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    const user = await UserModel.getByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    await UserModel.update(user.id, { isVerified: true });
    await VerificationCodeModel.deleteByEmail(email);

    const updatedUser = await UserModel.getByEmail(email);
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, isAdmin: updatedUser.isAdmin || false },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'حساب شما با موفقیت تأیید شد',
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified,
          isAdmin: updatedUser.isAdmin || false,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ General error (verify):', error);
    return NextResponse.json(
      { error: 'خطا در تأیید کد' },
      { status: 500 }
    );
  }
}
