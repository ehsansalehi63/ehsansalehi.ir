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

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
const FB_PAGE_ID = process.env.FB_PAGE_ID || '';

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_RECIPIENT_ID = process.env.WHATSAPP_RECIPIENT_ID || process.env.WHATSAPP_CHANNEL_ID || '';

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || '';
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || '';

const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/og-image.jpg';

async function getAutomationSetting(key: string): Promise<string> {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM automation_settings WHERE setting_key = ? LIMIT 1', [key]);
    return (rows as any[])[0]?.setting_value || '';
  } catch {
    return '';
  }
}

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

    const caption = `🔥 <b>${title}</b>\n\n📰 ${summary}\n\n🏷️ منبع: ${sourceName}\n🔗 <a href="${link}">مطالعه کامل خبر و تحلیل هوش مصنوعی روی سایت احسان صالحی</a>\n🌐 لینک مستقیم: ${link}\n\n──────────────────\n👨‍💻 <b>احسان صالحی</b> | متخصص IT، معمار شبکه و امنیت با ۲۰ سال سابقه\n🌐 ehsansalehi.ir | ⚡ @ehsansalehi_tech`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHANNEL_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
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

    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل خبر روی سایت:\n🌐 ${link}\n\n──────────────────\n👨‍💻 احسان صالحی | متخصص IT، معمار شبکه و امنیت با ۲۰ سال سابقه\n🌐 ehsansalehi.ir | ⚡ @ehsansalehi_tech`;
    
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

    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل خبر روی سایت:\n🌐 ${link}\n\n──────────────────\n👨‍💻 احسان صالحی | متخصص IT، معمار شبکه و امنیت با ۲۰ سال سابقه\n🌐 ehsansalehi.ir | ⚡ @ehsansalehi_tech`;
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
    const plainText = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل خبر روی سایت:\n🌐 ${link}\n\n──────────────────\n👨‍💻 احسان صالحی | متخصص IT، معمار شبکه و امنیت با ۲۰ سال سابقه\n🌐 ehsansalehi.ir | ⚡ @ehsansalehi_tech`;
    const cleanId = RUBIKA_CHAT_ID.trim().replace(/^@/, '');
    const idVariants = cleanId.match(/^[a-zA-Z0-9]{32}$/) || cleanId.startsWith('c0') || cleanId.startsWith('s0')
      ? [cleanId]
      : [cleanId, `@${cleanId}`];

    let lastError = '';

    for (const targetId of idVariants) {
      try {
        const urlMessage = `https://botapi.rubika.ir/v3/${RUBIKA_BOT_TOKEN}/sendMessage`;
        const resMsg = await fetch(urlMessage, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: targetId, object_guid: targetId, text: plainText }),
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

    return { success: false, error: lastError || 'روبیکا: ارسال پیام ناموفق بود' };
  } catch (error: any) {
    return { success: false, error: `روبیکا Exception: ${error?.message || error}` };
  }
}

export async function sendToFacebook(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<{ success: boolean; error?: string }> {
  const fbToken = FB_PAGE_ACCESS_TOKEN || await getAutomationSetting('fb_access_token');
  const fbPageId = FB_PAGE_ID || await getAutomationSetting('fb_page_id');

  if (!fbToken || !fbPageId) {
    return { success: false, error: 'توکن FB_PAGE_ACCESS_TOKEN یا FB_PAGE_ID تنظیم نشده است' };
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل در پایگاه اخبار و فناوری: ${link}\n\n#فناوری #هوش_مصنوعی #رمزارز #IT #EhsanSalehi`;
    const url = `https://graph.facebook.com/v19.0/${fbPageId}/photos`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: fullImageUrl,
        caption: caption,
        access_token: fbToken,
      }),
    });
    const result = await res.json();
    if (res.ok && result.id) {
      console.log('✅ فیس‌بوک: پست با موفقیت منتشر شد (ID:', result.id, ')');
      return { success: true };
    }
    return { success: false, error: `فیس‌بوک API Error: ${JSON.stringify(result)}` };
  } catch (error: any) {
    return { success: false, error: `فیس‌بوک Exception: ${error?.message || error}` };
  }
}

export async function sendToWhatsAppChannel(
  title: string,
  summary: string,
  link: string
): Promise<{ success: boolean; error?: string }> {
  const callMeBotKey = process.env.CALLMEBOT_API_KEY || await getAutomationSetting('callmebot_key');
  const recipientPhone = WHATSAPP_RECIPIENT_ID || await getAutomationSetting('whatsapp_phone') || '989108308799';

  if (callMeBotKey) {
    try {
      const caption = `🔥 *${title}*\n\n📰 ${summary}\n\n🔗 لینک خبر:\n${link}`;
      const url = `https://api.callmebot.com/whatsapp.php?phone=${recipientPhone}&text=${encodeURIComponent(caption)}&apikey=${callMeBotKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const text = await res.text();
      if (res.ok && !text.toLowerCase().includes('error')) {
        console.log('✅ واتساپ (CallMeBot): پیام با موفقیت ارسال شد');
        return { success: true };
      }
      return { success: false, error: `CallMeBot Error: ${text}` };
    } catch (e: any) {
      return { success: false, error: `CallMeBot Exception: ${e?.message || e}` };
    }
  }

  // بررسی سرویس Green API برای کانال و گروه‌های واتساپ (با اسکن کد QR)
  const greenInstance = process.env.GREEN_API_INSTANCE_ID || await getAutomationSetting('green_api_instance');
  const greenToken = process.env.GREEN_API_TOKEN || await getAutomationSetting('green_api_token');
  if (greenInstance && greenToken) {
    try {
      const caption = `🔥 *${title}*\n\n📰 ${summary}\n\n🔗 مطالعه کامل خبر:\n${link}`;
      const chatId = recipientPhone.includes('@') ? recipientPhone : `${recipientPhone}@c.us`;
      const url = `https://api.green-api.com/waInstance${greenInstance}/sendMessage/${greenToken}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: caption }),
      });
      const data = await res.json();
      if (res.ok && (data.idMessage || data.id)) {
        console.log('✅ واتساپ (Green API): پیام با موفقیت به گروه/کانال ارسال شد');
        return { success: true };
      }
      return { success: false, error: `Green API Error: ${JSON.stringify(data)}` };
    } catch (e: any) {
      return { success: false, error: `Green API Exception: ${e?.message || e}` };
    }
  }

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_RECIPIENT_ID) {
    return { success: false, error: 'متغیرهای CALLMEBOT_API_KEY یا GREEN_API یا WHATSAPP_ACCESS_TOKEN تنظیم نشده‌اند' };
  }

  try {
    const caption = `🔥 *${title}*\n\n📰 ${summary}\n\n🔗 مطالعه کامل در: ${link}`;
    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: WHATSAPP_RECIPIENT_ID,
        type: 'text',
        text: { body: caption },
      }),
    });
    const result = await res.json();
    if (res.ok && result.messages) {
      console.log('✅ واتساپ (Cloud API): پیام با موفقیت ارسال شد');
      return { success: true };
    }
    return { success: false, error: `واتساپ API Error: ${JSON.stringify(result)}` };
  } catch (error: any) {
    return { success: false, error: `واتساپ Exception: ${error?.message || error}` };
  }
}

export async function sendToInstagram(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<{ success: boolean; error?: string }> {
  const igToken = INSTAGRAM_ACCESS_TOKEN || await getAutomationSetting('instagram_access_token') || await getAutomationSetting('fb_access_token');
  const igAccount = INSTAGRAM_ACCOUNT_ID || await getAutomationSetting('instagram_account_id');

  if (!igToken || !igAccount) {
    return { success: false, error: 'توکن INSTAGRAM_ACCESS_TOKEN یا INSTAGRAM_ACCOUNT_ID تنظیم نشده است' };
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 لینک در بیو یا سایت ehsansalehi.ir\n\n#TechNews #AI #Crypto #EhsanSalehi #فناوری #رمزارز #هوش_مصنوعی`;

    // مرحله ۱: ایجاد کانتینر تصویر در اینستاگرام
    const createUrl = `https://graph.facebook.com/v19.0/${igAccount}/media?image_url=${encodeURIComponent(fullImageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${igToken}`;
    const createRes = await fetch(createUrl, { method: 'POST' });
    const createData = await createRes.json();

    if (!createRes.ok || !createData.id) {
      return { success: false, error: `اینستاگرام ساخت مدیا: ${JSON.stringify(createData)}` };
    }

    const creationId = createData.id;

    // مرحله ۲: انتشار کانتینر
    const publishUrl = `https://graph.facebook.com/v19.0/${igAccount}/media_publish?creation_id=${creationId}&access_token=${igToken}`;
    const publishRes = await fetch(publishUrl, { method: 'POST' });
    const publishData = await publishRes.json();

    if (publishRes.ok && publishData.id) {
      console.log('✅ اینستاگرام: پست با موفقیت منتشر شد (ID:', publishData.id, ')');
      return { success: true };
    }
    return { success: false, error: `اینستاگرام انتشار مدیا: ${JSON.stringify(publishData)}` };
  } catch (error: any) {
    return { success: false, error: `اینستاگرام Exception: ${error?.message || error}` };
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
  const [tg, li, bl, et, rb, fb, wa, ig] = await Promise.all([
    sendToTelegram(title, summary, imageUrl, link, sourceName),
    sendToLinkedIn(title, summary, imageUrl, link),
    sendToBale(title, summary, imageUrl, link, sourceName),
    sendToEitaa(title, summary, imageUrl, link, sourceName),
    sendToRubika(title, summary, imageUrl, link, sourceName),
    sendToFacebook(title, summary, imageUrl, link),
    sendToWhatsAppChannel(title, summary, link),
    sendToInstagram(title, summary, imageUrl, link),
  ]);

  const results: Record<string, boolean> = {
    telegram: tg.success,
    linkedin: li.success,
    bale: bl.success,
    eitaa: et.success,
    rubika: rb.success,
    facebook: fb.success,
    whatsapp: wa.success,
    instagram: ig.success,
  };

  const errors: Record<string, string> = {};
  if (!tg.success && tg.error) errors.telegram = tg.error;
  if (!li.success && li.error) errors.linkedin = li.error;
  if (!bl.success && bl.error) errors.bale = bl.error;
  if (!et.success && et.error) errors.eitaa = et.error;
  if (!rb.success && rb.error) errors.rubika = rb.error;
  if (!fb.success && fb.error) errors.facebook = fb.error;
  if (!wa.success && wa.error) errors.whatsapp = wa.error;
  if (!ig.success && ig.error) errors.instagram = ig.error;

  const success = Object.values(results).some((val) => val === true);

  await pool.execute(
    `UPDATE news_posts 
     SET posted_to_social = ? 
     WHERE id = ?`,
    [JSON.stringify({ results, errors }), newsId]
  );

  return { success, results, errors };
}
