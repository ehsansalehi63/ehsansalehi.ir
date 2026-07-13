import { pool } from './db';
import { sendToLinkedIn } from './linkedinPoster';
import { addWatermarkToImage } from './watermark';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

const BALE_BOT_TOKEN = process.env.BALE_BOT_TOKEN || '';
const BALE_CHAT_ID = process.env.BALE_CHAT_ID || '';

const EITAA_BOT_TOKEN = process.env.EITAA_BOT_TOKEN || '';
const EITAA_CHAT_ID = process.env.EITAA_CHAT_ID || '';

const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/og-image.jpg';

function resolveImageUrl(url: string | null): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api/image-proxy')) {
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
    console.log('⏭️ تلگرام: توکن یا کانال تنظیم نشده است.');
    return false;
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl, { signal: AbortSignal.timeout(6000) });
    if (!imageRes.ok) {
      console.error(`❌ تلگرام: خطا در دریافت تصویر (${imageRes.status})`);
      return false;
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    const caption = `🔥 *${title}*\n\n📰 ${summary}\n\n🏷️ منبع: ${sourceName}\n🔗 [مطالعه خبر در پایگاه احسان صالحی](${link})`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHANNEL_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    formData.append('photo', new Blob([new Uint8Array(watermarkedBuffer)], { type: 'image/png' }), 'cover.png');

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();

    if (result.ok) {
      console.log('✅ تلگرام: پست با کاور اختصاصی ارسال شد.');
      return true;
    } else {
      console.error('❌ تلگرام API Error:', result.description);
      return false;
    }
  } catch (error: any) {
    console.error('❌ تلگرام Exception:', error?.message || error);
    return false;
  }
}

export async function sendToBale(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string
): Promise<boolean> {
  if (!BALE_BOT_TOKEN || !BALE_CHAT_ID) {
    console.log('⏭️ بله: توکن (BALE_BOT_TOKEN) یا شناسه چت (BALE_CHAT_ID) تنظیم نشده است.');
    return false;
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl, { signal: AbortSignal.timeout(6000) });
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل در: ${link}`;
    const url = `https://tumbleweed.bale.ai/bot${BALE_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', BALE_CHAT_ID);
    formData.append('caption', caption);
    formData.append('photo', new Blob([new Uint8Array(watermarkedBuffer)], { type: 'image/png' }), 'cover.png');

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();

    if (result.ok) {
      console.log('✅ بله: پست با کاور اختصاصی ارسال شد.');
      return true;
    } else {
      console.error('❌ بله API Error:', result.description);
      return false;
    }
  } catch (error: any) {
    console.error('❌ بله Exception:', error?.message || error);
    return false;
  }
}

export async function sendToEitaa(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string
): Promise<boolean> {
  if (!EITAA_BOT_TOKEN || !EITAA_CHAT_ID) {
    console.log('⏭️ ایتا: توکن (EITAA_BOT_TOKEN) یا شناسه چت (EITAA_CHAT_ID) تنظیم نشده است.');
    return false;
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl, { signal: AbortSignal.timeout(6000) });
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل در: ${link}`;
    const url = `https://eitaayar.ir/api/${EITAA_BOT_TOKEN}/sendFile`;

    const formData = new FormData();
    formData.append('chat_id', EITAA_CHAT_ID);
    formData.append('caption', caption);
    formData.append('file', new Blob([new Uint8Array(watermarkedBuffer)], { type: 'image/png' }), 'cover.png');

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();

    if (result.ok || result.success) {
      console.log('✅ ایتا: پست با کاور اختصاصی ارسال شد.');
      return true;
    } else {
      console.error('❌ ایتا API Error:', result.description || result.error);
      return false;
    }
  } catch (error: any) {
    console.error('❌ ایتا Exception:', error?.message || error);
    return false;
  }
}

export async function sendToRubika(...args: any[]): Promise<boolean> {
  console.log('⏭️ روبیکا: وب‌هوک و توکن رسمی عمومی ندارد.');
  return false;
}

export async function postNewsToAllChannels(
  newsId: number,
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string = 'پایگاه اخبار فناوری'
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {
    telegram: await sendToTelegram(title, summary, imageUrl, link, sourceName),
    linkedin: await sendToLinkedIn(title, summary, imageUrl, link),
    bale: await sendToBale(title, summary, imageUrl, link, sourceName),
    eitaa: await sendToEitaa(title, summary, imageUrl, link, sourceName),
  };

  const success = results.telegram || results.linkedin || results.bale || results.eitaa;

  await pool.execute(
    `UPDATE news_posts 
     SET posted_to_social = ? 
     WHERE id = ?`,
    [JSON.stringify(results), newsId]
  );

  return { success, results };
}
