import { pool } from './db';
import { sendToLinkedIn } from './linkedinPoster';
import { addWatermarkToImage } from './watermark';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/og-image.jpg';

// تابع تبدیل URL نسبی به کامل
function resolveImageUrl(url: string | null): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api/image-proxy')) {
    // تبدیل /api/image-proxy?url=... به آدرس کامل
    const proxyUrl = new URL(url, 'https://ehsansalehi.ir');
    return proxyUrl.toString();
  }
  return url;
}

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
    // تبدیل URL به کامل
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl);
    if (!imageRes.ok) {
      console.error(`❌ تلگرام: خطا در دریافت تصویر (${imageRes.status})`);
      return false;
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // افزودن واترمارک
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    const caption = `📰 *${title}*\n\n${summary}\n\n🔗 [مشاهده کامل خبر](${link})`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHANNEL_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    formData.append('disable_web_page_preview', 'false');

    const blob = new Blob([new Uint8Array(watermarkedBuffer)], { type: 'image/png' });
    formData.append('photo', blob, 'cover.png');

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();

    if (result.ok) {
      console.log('✅ تلگرام: پست با واترمارک ارسال شد');
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

// ====== توابع غیرفعال ======
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

// ====== تابع اصلی ======
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
    linkedin: await sendToLinkedIn(title, summary, imageUrl, link),
  };

  const success = results.telegram || results.linkedin;

  await pool.execute(
    `UPDATE news_posts 
     SET posted_to_social = ? 
     WHERE id = ?`,
    [JSON.stringify(results), newsId]
  );

  return { success, results };
}
