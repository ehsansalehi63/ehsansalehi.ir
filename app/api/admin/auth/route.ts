import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    }

    let isAuthenticated = false;
    let userId = 0;
    let userName = 'مدیر سایت';
    let userEmail = username;

    // 1. Check against Vercel environment variables (ADMIN_USERNAME / ADMIN_PASSWORD)
    const envAdminUsername = process.env.ADMIN_USERNAME || 'admin';
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === envAdminUsername) {
      // Check if password matches envAdminPassword directly or bcrypt hash
      if (password === envAdminPassword || bcrypt.compareSync(password, bcrypt.hashSync(envAdminPassword, 10))) {
        isAuthenticated = true;
        userName = envAdminUsername;
      }
    }

    // 2. If not authenticated via env, check MySQL `users` table for an Admin account
    if (!isAuthenticated) {
      try {
        const rows = await query<any>(
          'SELECT * FROM users WHERE (`email` = ? OR `name` = ?) AND `isAdmin` = true LIMIT 1',
          [username, username]
        );
        if (rows && rows.length > 0) {
          const dbUser = rows[0];
          if (bcrypt.compareSync(password, dbUser.password)) {
            isAuthenticated = true;
            userId = dbUser.id;
            userName = dbUser.name;
            userEmail = dbUser.email;
          }
        }
      } catch (dbError) {
        console.warn('⚠️ خطا در بررسی جدول users برای لاگین ادمین:', dbError);
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: userId, username: userName, email: userEmail, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: userId, username: userName, email: userEmail, isAdmin: true }
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800,
      path: '/',
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('❌ خطا در احراز هویت ادمین:', error);
    return NextResponse.json({ error: 'خطا در احراز هویت' }, { status: 500 });
  }
}
