import { pool } from './db';
import { createSmartCover } from './createSmartCover';

// ============================================================
// تنظیمات تلگرام
// ============================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

// ============================================================
// ارسال به تلگرام (با کاور هوشمند)
// ============================================================
export async function sendToTelegram(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.log('⏭️ تلگرام: توکن یا کانال تنظیم نشده');
    return false;
  }

  try {
    // ساخت کاور هوشمند (با canvas یا fallback)
    const coverBuffer = await createSmartCover(imageUrl, title, sourceName);
    
    // کپشن پیام
    const caption = `📰 *${title}*\n\n${summary}\n\n🔗 [مشاهده کامل خبر](${link})`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    // ارسال تصویر به‌صورت فایل
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHANNEL_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    formData.append('disable_web_page_preview', 'false');

    const blob = new Blob([new Uint8Array(coverBuffer)], { type: 'image/png' });
    formData.append('photo', blob, 'cover.png');

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();

    if (result.ok) {
      console.log('✅ تلگرام: پست ارسال شد (کاور هوشمند)');
      return true;
    } else {
      console.error('❌ تلگرام:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ تلگرام error:', error);
    return false;
  }
}

// ============================================================
// سایر پلتفرم‌ها (غیرفعال)
// ============================================================
export async function sendToBale(...args: any[]): Promise<boolean> {
  console.log('⏭️ بله: غیرفعال است');
  return false;
}

export async function sendToRubika(...args: any[]): Promise<boolean> {
  console.log('⏭️ روبیکا: غیرفعال است');
  return false;
}

export async function sendToEitaa(...args: any[]): Promise<boolean> {
  console.log('⏭️ ایتا: غیرفعال است');
  return false;
}

export async function sendToWhatsApp(...args: any[]): Promise<boolean> {
  console.log('⏭️ واتساپ: غیرفعال است');
  return false;
}

export async function sendToInstagram(...args: any[]): Promise<boolean> {
  console.log('⏭️ اینستاگرام: غیرفعال است');
  return false;
}

// ============================================================
// تابع اصلی: ارسال فقط به تلگرام
// ============================================================
export async function postNewsToAllChannels(
  newsId: number,
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string = 'منبع ناشناس'
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {
    telegram: await sendToTelegram(title, summary, imageUrl, link, sourceName),
  };

  const success = results.telegram;

  await pool.execute(
    `UPDATE news_posts 
     SET posted_to_social = ? 
     WHERE id = ?`,
    [JSON.stringify(results), newsId]
  );

  return { success, results };
}
