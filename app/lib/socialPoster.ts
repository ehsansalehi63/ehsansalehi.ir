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

    const caption = `🔥 *${title}*\n\n📰 ${summary}\n\n🏷️ منبع: ${sourceName}\n🔗 [مطالعه کامل خبر و تحلیل AI](${link})\n\n──────────────────\n👨‍💻 *احسان صالحی* | متخصص IT، معمار شبکه و امنیت با ۲۰ سال سابقه\n🌐 ehsansalehi.ir | ⚡ @ehsansalehi_tech`;
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
    const plainText = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل در: ${link}`;
    const cleanId = RUBIKA_CHAT_ID.trim().replace(/^@/, '');
    const idVariants = cleanId.match(/^[a-zA-Z0-9]{32}$/) || cleanId.startsWith('c0') || cleanId.startsWith('s0')
      ? [cleanId]
      : [cleanId, `@${cleanId}`];

    let lastError = '';

    for (const targetId of idVariants) {
      // 1. تلاش با متد متنی sendMessage (بدون عکس جهت تضمین ارسال پیام)
      try {
        const urlMessage = `https://botapi.rubika.ir/v3/${RUBIKA_BOT_TOKEN}/sendMessage`;
        // تست ارسال با chat_id
        const resMsg1 = await fetch(urlMessage, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: targetId, text: plainText }),
        });
        const resultMsg1 = await resMsg1.json();
        if (resultMsg1.ok || resultMsg1.status === 'OK' || resultMsg1.status === 200 || (resultMsg1.data && resultMsg1.data.message_id)) {
          return { success: true };
        } else {
          lastError = `sendMessage(chat_id: ${targetId}): ${JSON.stringify(resultMsg1)}`;
        }

        // تست ارسال با object_guid
        const resMsg2 = await fetch(urlMessage, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ object_guid: targetId, text: plainText }),
        });
        const resultMsg2 = await resMsg2.json();
        if (resultMsg2.ok || resultMsg2.status === 'OK' || resultMsg2.status === 200 || (resultMsg2.data && resultMsg2.data.message_id)) {
          return { success: true };
        } else {
          lastError = `sendMessage(object_guid: ${targetId}): ${JSON.stringify(resultMsg2)}`;
        }
      } catch (err: any) {
        lastError = `sendMessage exception: ${err?.message || err}`;
      }
    }

    return { success: false, error: lastError || 'روبیکا: ارسال پیام ناموفق بود' };
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
  const [tg, li, bl, et, rb] = await Promise.all([
    sendToTelegram(title, summary, imageUrl, link, sourceName),
    sendToLinkedIn(title, summary, imageUrl, link),
    sendToBale(title, summary, imageUrl, link, sourceName),
    sendToEitaa(title, summary, imageUrl, link, sourceName),
    sendToRubika(title, summary, imageUrl, link, sourceName),
  ]);

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
