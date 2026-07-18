import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    const user = await UserModel.getByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, isAdmin: Boolean(user.isAdmin) },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin || false,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ General error (login):', error);
    return NextResponse.json(
      { error: 'خطا در ورود' },
      { status: 500 }
    );
  }
}
