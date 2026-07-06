import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const isValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return NextResponse.json({ error: 'نام کاربری یا رمز عبور اشتباه است' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطا در احراز هویت' }, { status: 500 });
  }
}
