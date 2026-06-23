import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/app/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن وارد نشده است' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    // دریافت اطلاعات کاربر از دیتابیس MySQL
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // حذف رمز عبور از پاسخ
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('❌ خطا در دریافت اطلاعات کاربر:', error);
    return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
  }
}
