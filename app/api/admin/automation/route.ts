import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    // 0. تضمین وجود جدول تنظیمات سناریوساز اتوماسیون
    try {
      await pool.execute(`CREATE TABLE IF NOT EXISTS automation_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
    } catch {
      // ignore
    }

    // 1. خواندن تنظیمات ذخیره‌شده از دیتابیس
    const [rows] = await pool.execute('SELECT setting_key, setting_value FROM automation_settings');
    const dbSettings: Record<string, string> = {};
    if (Array.isArray(rows)) {
      for (const row of rows as any[]) {
        dbSettings[row.setting_key] = row.setting_value || '';
      }
    }

    // 2. وضعیت اتصال شبکه‌های اجتماعی (ترکیب متغیرهای Vercel و تنظیمات دیتابیس هاستینگر)
    const status = {
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID),
      linkedin: Boolean(process.env.LINKEDIN_ACCESS_TOKEN),
      bale: Boolean((process.env.BALE_BOT_TOKEN && (process.env.BALE_CHANNEL_ID || process.env.BALE_CHAT_ID)) || dbSettings['bale_token']),
      eitaa: Boolean((process.env.EITAA_BOT_TOKEN && (process.env.EITAA_CHANNEL_ID || process.env.EITAA_CHAT_ID)) || dbSettings['eitaa_token']),
      whatsapp: Boolean(process.env.CALLMEBOT_API_KEY || dbSettings['callmebot_key'] || process.env.WHATSAPP_ACCESS_TOKEN),
      facebook: Boolean(process.env.FB_PAGE_ACCESS_TOKEN || dbSettings['fb_access_token']),
      instagram: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN || dbSettings['instagram_access_token'] || process.env.FB_PAGE_ACCESS_TOKEN || dbSettings['fb_access_token']),
      webhook: true, // وب‌هوک داخلی سایت همیشه فعال است
    };

    return NextResponse.json({
      success: true,
      settings: dbSettings,
      status,
      message: '✅ وضعیت سناریوساز خودکار و ماژول‌های اتصال استخراج شد',
    });
  } catch (error: any) {
    console.error('❌ خطا در دریافت وضعیت اتوماسیون:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await verifyAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'اطلاعات ارسالی معتبر نیست' }, { status: 400 });
    }

    // ذخیره‌سازی کلیدها در جدول automation_settings
    const keysToSave = [
      'callmebot_key',
      'whatsapp_phone',
      'fb_access_token',
      'fb_page_id',
      'instagram_access_token',
      'instagram_account_id',
      'bale_token',
      'eitaa_token',
    ];

    for (const key of keysToSave) {
      if (body[key] !== undefined) {
        const val = String(body[key]).trim();
        await pool.execute(
          'INSERT INTO automation_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, val, val]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '🎉 کلیدها و تنظیمات سناریوساز خودکار با موفقیت در دیتابیس هاستینگر ذخیره شد و بلافاصله در موتور انتشار فعال گردید',
    });
  } catch (error: any) {
    console.error('❌ خطا در ذخیره تنظیمات اتوماسیون:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
