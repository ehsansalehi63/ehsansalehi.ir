import { pool } from './db';
import { sendToLinkedIn } from './linkedinPoster';
import { addWatermarkToImage } from './watermark';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

const BALE_BOT_TOKEN = process.env.BALE_BOT_TOKEN || '';
const BALE_CHAT_ID = process.env.BALE_CHANNEL_ID || process.env.BALE_CHAT_ID || '';

const EITAA_BOT_TOKEN = process.env.EITAA_BOT_TOKEN || '';
const EITAA_CHAT_ID = process.env.EITAA_CHANNEL_ID || process.env.EITAA_CHAT_ID || '';

const RUBIKA_BOT_TOKEN = process.env.RUBIKA_BOT_TOKEN || '';
const RUBIKA_CHAT_ID = process.env.RUBIKA_CHANNEL_ID || process.env.RUBIKA_CHAT_ID || '';

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
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN یا TELEGRAM_CHANNEL_ID تنظیم نشده است' };
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl, { signal: AbortSignal.timeout(6000) });
    if (!imageRes.ok) {
      return { success: false, error: `خطا در دانلود عکس از ${fullImageUrl} (${imageRes.status})` };
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
      return { success: true };
    } else {
      return { success: false, error: `تلگرام API Error: ${result.description}` };
    }
  } catch (error: any) {
    return { success: false, error: `تلگرام Exception: ${error?.message || error}` };
  }
}

export async function sendToBale(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string
): Promise<{ success: boolean; error?: string }> {
  if (!BALE_BOT_TOKEN || !BALE_CHAT_ID) {
    return { success: false, error: 'BALE_BOT_TOKEN یا BALE_CHANNEL_ID تنظیم نشده است' };
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl, { signal: AbortSignal.timeout(6000) });
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل در: ${link}`;
    
    // تلاش با آدرس‌های متعدد API بله جهت عبور از محدودیت‌های شبکه ابری Vercel
    const baleDomains = ['https://tapi.bale.ai', 'https://api.bale.ai', 'https://tumbleweed.bale.ai'];
    let lastErr = '';

    for (const domain of baleDomains) {
      try {
        const url = `${domain}/bot${BALE_BOT_TOKEN}/sendPhoto`;
        const formData = new FormData();
        formData.append('chat_id', BALE_CHAT_ID);
        formData.append('caption', caption);
        formData.append('photo', new Blob([new Uint8Array(watermarkedBuffer)], { type: 'image/png' }), 'cover.png');

        const response = await fetch(url, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.ok) {
          return { success: true };
        } else {
          lastErr = `${domain}: ${result.description}`;
        }
      } catch (err: any) {
        lastErr = `${domain} Exception: ${err?.message || err}`;
      }
    }

    return { success: false, error: lastErr || 'تمام آدرس‌های بله شکست خوردند' };
  } catch (error: any) {
    return { success: false, error: `بله Exception: ${error?.message || error}` };
  }
}

export async function sendToEitaa(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string
): Promise<{ success: boolean; error?: string }> {
  if (!EITAA_BOT_TOKEN || !EITAA_CHAT_ID) {
    return { success: false, error: 'EITAA_BOT_TOKEN یا EITAA_CHANNEL_ID تنظیم نشده است' };
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
      return { success: true };
    } else {
      return { success: false, error: `ایتا API Error: ${JSON.stringify(result)}` };
    }
  } catch (error: any) {
    return { success: false, error: `ایتا Exception: ${error?.message || error}` };
  }
}

export async function sendToRubika(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string
): Promise<{ success: boolean; error?: string }> {
  if (!RUBIKA_BOT_TOKEN || !RUBIKA_CHAT_ID) {
    return { success: false, error: 'RUBIKA_BOT_TOKEN یا RUBIKA_CHANNEL_ID تنظیم نشده است' };
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl, { signal: AbortSignal.timeout(6000) });
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل در: ${link}`;
    
    const cleanId = RUBIKA_CHAT_ID.replace(/^@/, '');
    const idVariants = [RUBIKA_CHAT_ID, cleanId, `@${cleanId}`];
    const uniqueIds = Array.from(new Set(idVariants));

    let lastError = '';

    for (const targetId of uniqueIds) {
      // 1. تلاش با sendPhoto
      try {
        const urlPhoto = `https://botapi.rubika.ir/v3/${RUBIKA_BOT_TOKEN}/sendPhoto`;
        const formData = new FormData();
        formData.append('chat_id', targetId);
        formData.append('object_guid', targetId);
        formData.append('caption', caption);
        formData.append('text', caption);
        formData.append('file', new Blob([new Uint8Array(watermarkedBuffer)], { type: 'image/png' }), 'cover.png');
        formData.append('photo', new Blob([new Uint8Array(watermarkedBuffer)], { type: 'image/png' }), 'cover.png');

        const response = await fetch(urlPhoto, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.ok || result.status === 'OK' || result.status === 200 || (result.data && result.data.message_id)) {
          return { success: true };
        } else {
          lastError = `sendPhoto (${targetId}): ${JSON.stringify(result)}`;
        }
      } catch (err: any) {
        lastError = `sendPhoto (${targetId}) exception: ${err?.message || err}`;
      }

      // 2. تلاش با sendMessage (متنی)
      try {
        const urlMessage = `https://botapi.rubika.ir/v3/${RUBIKA_BOT_TOKEN}/sendMessage`;
        const resMsg = await fetch(urlMessage, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetId,
            object_guid: targetId,
            text: caption,
          }),
        });
        const resultMsg = await resMsg.json();
        if (resultMsg.ok || resultMsg.status === 'OK' || resultMsg.status === 200 || (resultMsg.data && resultMsg.data.message_id)) {
          return { success: true };
        } else {
          lastError = `sendMessage (${targetId}): ${JSON.stringify(resultMsg)}`;
        }
      } catch (err: any) {
        lastError = `sendMessage (${targetId}) exception: ${err?.message || err}`;
      }
    }

    return { success: false, error: lastError || 'روبیکا: تمامی فرمت‌های شناسه کانال ناموفق بودند' };
  } catch (error: any) {
    return { success: false, error: `روبیکا Exception: ${error?.message || error}` };
  }
}

export async function postNewsToAllChannels(
  newsId: number,
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string = 'پایگاه اخبار فناوری'
): Promise<{ success: boolean; results: Record<string, boolean>; errors: Record<string, string> }> {
  const tg = await sendToTelegram(title, summary, imageUrl, link, sourceName);
  const li = await sendToLinkedIn(title, summary, imageUrl, link);
  const bl = await sendToBale(title, summary, imageUrl, link, sourceName);
  const et = await sendToEitaa(title, summary, imageUrl, link, sourceName);
  const rb = await sendToRubika(title, summary, imageUrl, link, sourceName);

  const results: Record<string, boolean> = {
    telegram: tg.success,
    linkedin: li.success,
    bale: bl.success,
    eitaa: et.success,
    rubika: rb.success,
  };

  const errors: Record<string, string> = {};
  if (!tg.success && tg.error) errors.telegram = tg.error;
  if (!li.success && li.error) errors.linkedin = li.error;
  if (!bl.success && bl.error) errors.bale = bl.error;
  if (!et.success && et.error) errors.eitaa = et.error;
  if (!rb.success && rb.error) errors.rubika = rb.error;

  const success = Object.values(results).some((val) => val === true);

  await pool.execute(
    `UPDATE news_posts 
     SET posted_to_social = ? 
     WHERE id = ?`,
    [JSON.stringify({ results, errors }), newsId]
  );

  return { success, results, errors };
}
