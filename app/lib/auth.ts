import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserModel } from './models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface TokenPayload {
  id: number;
  email?: string;
  username?: string;
  name?: string;
  isAdmin: boolean;
}

export function verifyToken(request: Request | NextRequest): TokenPayload | null {
  try {
    // 1. Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      if (decoded) return decoded;
    }

    // 2. Check cookies
    if ('cookies' in request && request.cookies && typeof (request as NextRequest).cookies.get === 'function') {
      const nextReq = request as NextRequest;
      const tokenCookie = nextReq.cookies.get('admin_token')?.value || nextReq.cookies.get('token')?.value;
      if (tokenCookie) {
        const decoded = jwt.verify(tokenCookie, JWT_SECRET) as TokenPayload;
        if (decoded) return decoded;
      }
    }

    // 3. Fallback parse cookie header string
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const matchAdmin = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
      const matchToken = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      const rawToken = matchAdmin?.[1] || matchToken?.[1];
      if (rawToken) {
        const decoded = jwt.verify(rawToken, JWT_SECRET) as TokenPayload;
        if (decoded) return decoded;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function verifyAdmin(request: Request | NextRequest): Promise<NextResponse | null> {
  const payload = verifyToken(request);

  // If valid token with isAdmin=true or 1
  if (payload && (payload.isAdmin === true || (payload as any).isAdmin === 1 || Boolean(payload.isAdmin))) {
    return null; // Authorized
  }

  // Double check DB if valid user id exists
  if (payload && payload.id && payload.id > 0) {
    try {
      const user = await UserModel.getById(payload.id);
      if (user && (user.isAdmin === true || (user as any).isAdmin === 1 || Boolean(user.isAdmin))) {
        return null; // Authorized from DB
      }
    } catch (e) {
      // ignore
    }
  }

  return NextResponse.json(
    { success: false, error: '⛔ دسترسی غیرمجاز. برای مشاهده این بخش باید با حساب مدیر (Admin) وارد شوید.' },
    { status: 401 }
  );
}

export function verifyCron(request: NextRequest): NextResponse | null {
  const cronHeader = request.headers.get('x-vercel-cron');
  if (cronHeader === '1') return null; // Vercel Cron automated execution

  const authHeader = request.headers.get('authorization');
  const secretParam = request.nextUrl?.searchParams?.get('secret') || request.nextUrl?.searchParams?.get('cron_secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && (secretParam === cronSecret || authHeader === `Bearer ${cronSecret}`)) {
    return null; // Authorized via secret
  }

  if (cronSecret) {
    return NextResponse.json(
      { success: false, error: '⛔ اجرای کرون‌جاب بدون کلید امنیتی (CRON_SECRET) مجاز نیست.' },
      { status: 401 }
    );
  }

  return null;
}
