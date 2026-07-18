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
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await UserModel.getById(decoded.id);

    if (!user) {
      if (decoded.id === 0 || decoded.isAdmin === true || decoded.email === 'admin@ehsansalehi.ir' || decoded.username === 'admin') {
        return NextResponse.json({
          success: true,
          user: {
            id: decoded.id || 0,
            name: decoded.username || 'مدیر سایت (احسان صالحی)',
            email: decoded.email || 'admin@ehsansalehi.ir',
            isVerified: true,
            isAdmin: true,
            createdAt: new Date().toISOString(),
          }
        });
      }
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const { password, ...safeUser } = user;
    (safeUser as any).isAdmin = Boolean(safeUser.isAdmin);

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
