import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserModel } from '@/lib/models/User';
import { query } from '@/lib/mysql';

export async function POST(request: Request) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی است' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const rows = await query(
      'SELECT * FROM password_resets WHERE email = ? AND token = ? AND expiresAt > NOW() ORDER BY createdAt DESC LIMIT 1',
      [email, token]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'لینک نامعتبر یا منقضی شده است' },
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

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await UserModel.update(user.id, { password: hashedPassword });
    await query('DELETE FROM password_resets WHERE email = ? AND token = ?', [email, token]);

    return NextResponse.json(
      {
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد',
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ General error (reset password):', error);
    return NextResponse.json(
      { error: 'خطا در بازنشانی رمز' },
      { status: 500 }
    );
  }
}
