import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { z } from 'zod';

// ============================================================
// ولیدیشن با Zod
// ============================================================
const commentSchema = z.object({
  newsId: z.number().int().positive(),
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  content: z.string().min(3).max(2000),
});

export const runtime = 'nodejs';

// ============================================================
// دریافت نظرات یک خبر
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const newsId = searchParams.get('newsId');

    if (!newsId || isNaN(parseInt(newsId))) {
      return NextResponse.json({ success: false, error: 'شناسه خبر معتبر نیست' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      `SELECT id, name, content, created_at 
       FROM news_comments 
       WHERE news_id = ? AND is_approved = TRUE 
       ORDER BY created_at DESC LIMIT 50`,
      [parseInt(newsId)]
    );

    return NextResponse.json({ success: true, comments: rows });
  } catch (error: any) {
    console.error('Comment fetch error:', error);
    return NextResponse.json({ success: false, error: 'خطا در دریافت نظرات' }, { status: 500 });
  }
}

// ============================================================
// ثبت نظر جدید (با امنیت کامل)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ولیدیشن
    const result = commentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'اطلاعات وارد شده معتبر نیست',
        details: result.error.errors 
      }, { status: 400 });
    }

    const { newsId, name, email, content } = result.data;

    // ۱. بررسی وجود خبر
    const [newsCheck] = await pool.execute(
      'SELECT id FROM news_posts WHERE id = ? AND is_published = TRUE',
      [newsId]
    );
    if ((newsCheck as any[]).length === 0) {
      return NextResponse.json({ success: false, error: 'خبر مورد نظر یافت نشد' }, { status: 404 });
    }

    // ۲. محدودیت نرخ (Rate Limiting) - جلوگیری از اسپم
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const [recent] = await pool.execute(
      'SELECT COUNT(*) as count FROM news_comments WHERE ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
      [ip]
    );
    if ((recent as any[])[0].count >= 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'شما در ۵ دقیقه گذشته بیش از حد مجاز نظر ثبت کرده‌اید. لطفاً کمی صبر کنید.' 
      }, { status: 429 });
    }

    // ۳. ذخیره نظر (با تابع sanitize)
    const sanitizedContent = sanitizeHtml(content);
    const userAgent = request.headers.get('user-agent') || '';

    await pool.execute(
      `INSERT INTO news_comments 
       (news_id, name, email, content, ip, user_agent, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newsId, name, email, sanitizedContent, ip, userAgent, false] // غیرفعال: نیاز به تأیید ادمین
    );

    return NextResponse.json({ 
      success: true, 
      message: 'نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده می‌شود.' 
    });
  } catch (error: any) {
    console.error('Comment save error:', error);
    return NextResponse.json({ success: false, error: 'خطا در ثبت نظر' }, { status: 500 });
  }
}

// ============================================================
// تابع امن‌سازی HTML (جلوگیری از XSS)
// ============================================================
function sanitizeHtml(text: string): string {
  // حذف تگ‌های HTML و اسکریپت
  return text
    .replace(/<[^>]*>/g, '') // حذف تگ‌های HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
