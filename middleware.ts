import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHash } from 'crypto';

// لیست IPهای مجاز برای پنل ادمین (اختیاری)
const ADMIN_ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // ============================================================
  // ۱. هدرهای امنیتی (Security Headers)
  // ============================================================
  // جلوگیری از کلیک‌جک
  response.headers.set('X-Frame-Options', 'DENY');
  // جلوگیری از MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // جلوگیری از XSS (مرورگرهای قدیمی)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // CSP (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://platform.vercel.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.vercel.com https://api.telegram.org;"
  );
  // HSTS (HTTP Strict Transport Security)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // ============================================================
  // ۲. محدودیت دسترسی به پنل ادمین (IP Whitelist)
  // ============================================================
  if (path.startsWith('/admin') && ADMIN_ALLOWED_IPS.length > 0) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || '';
    if (!ADMIN_ALLOWED_IPS.includes(ip)) {
      return new NextResponse('دسترسی غیرمجاز', { status: 403 });
    }
  }

  // ============================================================
  // ۳. حفاظت از API‌های حساس (Rate Limiting با شناسه یکتا)
  // ============================================================
  if (path.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown';
    const pathHash = createHash('sha256').update(path).digest('hex').slice(0, 8);
    const key = `rate_limit:${ip}:${pathHash}`;
    
    // در اینجا می‌توانید از Redis یا کش Vercel برای شمارش استفاده کنید
    // فعلاً یک پیاده‌سازی ساده با headerها
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
  }

  // ============================================================
  // ۴. مسدود کردن کوئری‌های مخرب
  // ============================================================
  const url = request.nextUrl;
  const searchParams = url.searchParams;
  const dangerousPatterns = /[<>'"]|script|javascript|onerror|onclick|onload/i;
  
  for (const [key, value] of searchParams.entries()) {
    if (dangerousPatterns.test(value) || dangerousPatterns.test(key)) {
      return new NextResponse('پارامترهای غیرمجاز', { status: 400 });
    }
  }

  return response;
}

// فقط روی مسیرهای خاص اعمال شود
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
// ذخیره بازدید در دیتابیس
if (!path.startsWith('/api/') && !path.startsWith('/_next/') && !path.startsWith('/images/') && !path.startsWith('/fonts/')) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  try {
    await pool.execute(
      'INSERT INTO site_visits (ip, page, user_agent, referer) VALUES (?, ?, ?, ?)',
      [ip, path || '/', userAgent, referer]
    );
  } catch {
    // خطا را نادیده بگیر
  }
}
