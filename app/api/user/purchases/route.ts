import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyToken(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'توکن نامعتبر یا منقضی شده است. لطفاً وارد حساب خود شوید.' }, { status: 401 });
    }

    // 0. تضمین وجود جداول دوره‌ها و خریدها
    try {
      await pool.execute(`CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        price INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

      await pool.execute(`CREATE TABLE IF NOT EXISTS user_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
    } catch {
      // ignore
    }

    // 1. اگر جدول دوره‌ها خالی است، ۳ دوره نمونه VIP تخصصی ایجاد کنیم
    try {
      const [cCountRes] = await pool.execute('SELECT COUNT(*) as count FROM courses');
      const totalCourses = (cCountRes as any[])[0]?.count || 0;
      if (totalCourses === 0) {
        const sampleCourses = [
          {
            title: 'دوره معماری و امنیت پیشرفته شبکه (Cisco & MikroTik Enterprise)',
            description: 'آموزش جامع طراحی زیرساخت شبکه‌های سازمانی، فایروال Kerio/FortiGate، پیکربندی روترهای میکروتیک و مجازی‌سازی ESXi / vCenter.',
            image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
            price: 4500000,
          },
          {
            title: 'دوره مسترکلد Full-Stack با Next.js 16 و معماری سرورلس Vercel',
            description: 'ساخت سامانه‌های مقیاس‌پذیر، پرسرعت و امن با Next.js App Router، دیتابیس Cloud MySQL و بهینه‌سازی سئوی ارگانیک.',
            image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
            price: 5200000,
          },
          {
            title: 'دوره مهندسی اتوماسیون هوش مصنوعی و ساخت چت‌بات‌های اختصاصی LLM',
            description: 'یکپارچه‌سازی مدل‌های قدرتمند OpenAI / GapGPT، ساخت خزنده‌های خودکار خبر، پردازش تصویر و انتشار در شبکه‌های اجتماعی.',
            image_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
            price: 4800000,
          }
        ];

        for (const sc of sampleCourses) {
          await pool.execute(
            'INSERT INTO courses (title, description, image_url, price, createdAt) VALUES (?, ?, ?, ?, NOW())',
            [sc.title, sc.description, sc.image_url, sc.price]
          );
        }
      }
    } catch {
      // ignore
    }

    // 2. اگر کاربر مدیر سایت است (admin@ehsansalehi.ir یا isAdmin=true)، تمامی دوره‌های تخصصی را به عنوان دسترسی باز (VIP) نشان دهیم
    if (payload.isAdmin || payload.email === 'admin@ehsansalehi.ir' || payload.id === 0) {
      const [rows] = await pool.execute('SELECT id, title, description, image_url, price, createdAt as purchased_at FROM courses ORDER BY id DESC');
      const courses = (rows as any[] || []).map((c: any) => ({
        ...c,
        progress: 100,
      }));
      return NextResponse.json({ success: true, data: courses });
    }

    // 3. برای کاربران عادی، دوره‌های خریداری‌شده بررسی شود
    const [uRows] = await pool.execute(
      'SELECT course_id, createdAt as purchased_at FROM user_courses WHERE user_id = ? ORDER BY id DESC',
      [payload.id]
    );
    const userCourses = uRows as any[] || [];
    if (userCourses.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const courseIds = userCourses.map(uc => uc.course_id);
    const placeholders = courseIds.map(() => '?').join(',');
    const [cRows] = await pool.execute(
      `SELECT id, title, description, image_url, price FROM courses WHERE id IN (${placeholders})`,
      courseIds
    );

    const purchasedList = (cRows as any[] || []).map((course: any) => {
      const ucRecord = userCourses.find(uc => uc.course_id === course.id);
      return {
        ...course,
        purchased_at: ucRecord?.purchased_at || new Date().toISOString(),
        progress: 100,
      };
    });

    return NextResponse.json({ success: true, data: purchasedList });
  } catch (error: any) {
    console.error('❌ خطا در دریافت دوره‌های کاربر:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
