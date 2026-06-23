import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/app/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'ایمیل و رمز عبور الزامی است' }, { status: 400 });
    }

    // جستجوی کاربر در دیتابیس MySQL
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }

    // بررسی تأیید بودن حساب کاربری
    if (!user.isVerified) {
      return NextResponse.json({ 
        error: 'حساب شما تأیید نشده است. ابتدا کد تأیید را وارد کنید' 
      }, { status: 401 });
    }

    // بررسی صحت رمز عبور
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }

    // ساخت توکن JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    console.error('❌ خطا در ورود:', error);
    return NextResponse.json({ error: 'خطا در ورود' }, { status: 500 });
  }
}
