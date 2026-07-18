import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public admin login path, migrate-data, init-db, resend-all-social, traffic-ai, and automation
  if (
    pathname === '/api/admin/auth' ||
    pathname === '/api/admin/migrate-data' ||
    pathname === '/api/admin/init-db' ||
    pathname === '/api/admin/resend-all-social' ||
    pathname === '/api/admin/traffic-ai' ||
    pathname === '/api/admin/automation' ||
    pathname === '/api/track-visit'
  ) {
    return NextResponse.next();
  }

  // Check token cookie or authorization header
  const tokenCookie = request.cookies.get('admin_token')?.value || request.cookies.get('token')?.value;
  const authHeader = request.headers.get('authorization');
  const hasAuth = Boolean(tokenCookie || (authHeader && authHeader.startsWith('Bearer ')));

  // 2. Protect /api/admin/* API routes
  if (pathname.startsWith('/api/admin')) {
    if (!hasAuth) {
      return NextResponse.json(
        { success: false, error: '⛔ دسترسی غیرمجاز. برای دسترسی به این بخش باید وارد حساب مدیر شوید.' },
        { status: 401 }
      );
    }
  }

  // 3. Protect /dashboard UI routes
  if (pathname.startsWith('/dashboard')) {
    if (!hasAuth) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/dashboard/:path*'],
};
