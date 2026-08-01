import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Surrogate-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

function applyNoStoreHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicBypass =
    pathname === '/api/admin/auth' ||
    pathname === '/api/admin/migrate' ||
    pathname === '/api/admin/migrate-data' ||
    pathname === '/api/admin/init-db' ||
    pathname === '/api/admin/resend-all-social' ||
    pathname === '/api/admin/traffic-ai' ||
    pathname === '/api/admin/automation' ||
    pathname === '/api/admin/master-control' ||
    // تشخیص وضعیت هاست — خودش با CRON_SECRET محافظت می‌شود
    pathname === '/api/admin/diagnose' ||
    pathname === '/api/admin/relay-test' ||
    pathname === '/api/track-visit' ||
    pathname.startsWith('/api/news');

  const needsNoStore =
    pathname === '/' ||
    pathname === '/news' ||
    pathname.startsWith('/news/') ||
    pathname.startsWith('/api/news');

  if (publicBypass) {
    const res = NextResponse.next();
    if (needsNoStore) applyNoStoreHeaders(res);
    return res;
  }

  const tokenCookie = request.cookies.get('admin_token')?.value || request.cookies.get('token')?.value;
  const authHeader = request.headers.get('authorization');
  const hasAuth = Boolean(tokenCookie || (authHeader && authHeader.startsWith('Bearer ')));

  if (pathname.startsWith('/api/admin')) {
    if (!hasAuth) {
      return NextResponse.json(
        { success: false, error: '⛔ دسترسی غیرمجاز. برای دسترسی به این بخش باید وارد حساب مدیر شوید.' },
        { status: 401 }
      );
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (!hasAuth) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  if (needsNoStore) applyNoStoreHeaders(response);
  return response;
}

export const config = {
  matcher: [
    '/',
    '/news',
    '/news/:path*',
    '/api/news',
    '/api/news/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
  ],
};
