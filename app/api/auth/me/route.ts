import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'توکن وارد نشده است' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const user = await UserModel.getById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const { password, ...safeUser } = user;

    return NextResponse.json(
      { success: true, user: safeUser },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ General error (me):', error);
    return NextResponse.json(
      { error: 'توکن نامعتبر است' },
      { status: 401 }
    );
  }
}
