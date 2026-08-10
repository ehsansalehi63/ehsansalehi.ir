import { pool } from './db';
import { sendToLinkedIn } from './linkedinPoster';
import { addWatermarkToImage } from './watermark';
import { publishViaRelay, isRelayConfigured } from './relayClient';
import { getMcpSocialConfig, publishToMcpSocialBridge } from './mcpSocialClient';
import { getMakeSocialConfig, publishViaMakeSocialBridge } from './makeSocialClient';

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

// نسخه Graph API — قابل تغییر بدون دست زدن به کد
const IG_GRAPH = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v21.0'}`;

// حالت انتشار اینستاگرام:
//   auto = تلاش برای انتشار خودکار (رله یا مستقیم)
//   semi = ارسال به تلگرام مدیر برای انتشار یک‌لمسی
//   off  = غیرفعال
const INSTAGRAM_MODE = 'off' as const; // Instagram handled by Base44 workflow

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
  if (url.startsWith('/')) return new URL(url, 'https://ehsansalehi.ir').toString();
  return url;
}


function isPersianText(text: string): boolean {
  const persianChars = text.match(/[\u0600-\u06FF]/g);
  return persianChars !== null && persianChars.length >= 5;
}

export async function sendToTelegram(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string,
  sourceName: string
): Promise<{ success: boolean; error?: string }> {
  const telegramToken = TELEGRAM_BOT_TOKEN || await getAutomationSetting('telegram_bot_token');
  const telegramChannelId = TELEGRAM_CHANNEL_ID || await getAutomationSetting('telegram_channel_id') || await getAutomationSetting('telegram_chat_id');

  if (!telegramToken || !telegramChannelId) {
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
    const url = `https://api.telegram.org/bot${telegramToken}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', telegramChannelId);
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
  const baleToken = BALE_BOT_TOKEN || await getAutomationSetting('bale_bot_token') || await getAutomationSetting('bale_token');
  const baleChatId = BALE_CHAT_ID || await getAutomationSetting('bale_channel_id') || await getAutomationSetting('bale_chat_id');

  if (!baleToken || !baleChatId) {
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
        const url = `${domain}/bot${baleToken}/sendPhoto`;
        const formData = new FormData();
        formData.append('chat_id', baleChatId);
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
  const eitaaToken = EITAA_BOT_TOKEN || await getAutomationSetting('eitaa_bot_token') || await getAutomationSetting('eitaa_token');
  const eitaaChatId = EITAA_CHAT_ID || await getAutomationSetting('eitaa_channel_id') || await getAutomationSetting('eitaa_chat_id');

  if (!eitaaToken || !eitaaChatId) {
    return { success: false, error: 'EITAA_BOT_TOKEN یا EITAA_CHANNEL_ID تنظیم نشده است' };
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);
    const imageRes = await fetch(fullImageUrl, { signal: AbortSignal.timeout(6000) });
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToImage(imageBuffer, title);

    const caption = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل خبر روی سایت:\n🌐 ${link}\n\n──────────────────\n👨‍💻 احسان صالحی | متخصص IT، معمار شبکه و امنیت با ۲۰ سال سابقه\n🌐 ehsansalehi.ir | ⚡ @ehsansalehi_tech`;
    const url = `https://eitaayar.ir/api/${eitaaToken}/sendFile`;

    const formData = new FormData();
    formData.append('chat_id', eitaaChatId);
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
  const rubikaToken = RUBIKA_BOT_TOKEN || await getAutomationSetting('rubika_bot_token') || await getAutomationSetting('rubika_token');
  const rubikaChatId = RUBIKA_CHAT_ID || await getAutomationSetting('rubika_channel_id') || await getAutomationSetting('rubika_chat_id');

  if (!rubikaToken || !rubikaChatId) {
    return { success: false, error: 'RUBIKA_BOT_TOKEN یا RUBIKA_CHANNEL_ID تنظیم نشده است' };
  }

  try {
    const plainText = `🔥 ${title}\n\n📰 ${summary}\n\n🔗 مطالعه کامل خبر روی سایت:\n🌐 ${link}\n\n──────────────────\n👨‍💻 احسان صالحی | متخصص IT، معمار شبکه و امنیت با ۲۰ سال سابقه\n🌐 ehsansalehi.ir | ⚡ @ehsansalehi_tech`;
    const cleanId = rubikaChatId.trim().replace(/^@/, '');
    const idVariants = cleanId.match(/^[a-zA-Z0-9]{32}$/) || cleanId.startsWith('c0') || cleanId.startsWith('s0')
      ? [cleanId]
      : [cleanId, `@${cleanId}`];

    let lastError = '';

    for (const targetId of idVariants) {
      try {
        const urlMessage = `https://botapi.rubika.ir/v3/${rubikaToken}/sendMessage`;
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

  const whatsappToken = WHATSAPP_ACCESS_TOKEN || await getAutomationSetting('whatsapp_access_token');
  const whatsappPhoneNumberId = WHATSAPP_PHONE_NUMBER_ID || await getAutomationSetting('whatsapp_phone_number_id');
  const whatsappRecipientId = WHATSAPP_RECIPIENT_ID || await getAutomationSetting('whatsapp_recipient_id');

  if (!whatsappToken || !whatsappPhoneNumberId || !whatsappRecipientId) {
    return { success: false, error: 'متغیرهای CALLMEBOT_API_KEY یا GREEN_API یا WHATSAPP_ACCESS_TOKEN تنظیم نشده‌اند' };
  }

  try {
    const caption = `🔥 *${title}*\n\n📰 ${summary}\n\n🔗 مطالعه کامل در: ${link}`;
    const url = `https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: whatsappRecipientId,
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

/** انتظار تا کانتینر رسانه در متا به وضعیت FINISHED برسد */
async function waitForInstagramContainer(
  containerId: string,
  token: string,
  maxTries = 20
): Promise<{ ready: boolean; error?: string }> {
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await fetch(
        `${IG_GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const data = await res.json();
      if (data.status_code === 'FINISHED') return { ready: true };
      if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
        return { ready: false, error: data.status || data.status_code };
      }
    } catch {
      // خطای گذرای شبکه — دوباره تلاش می‌کنیم
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return { ready: false, error: 'کانتینر در زمان مجاز آماده نشد' };
}

/**
 * ارسال پست آماده به تلگرام مدیر برای انتشار دستی در اینستاگرام.
 * تضمین می‌کند هیچ پستی گم نشود، حتی وقتی API در دسترس نیست.
 */
async function instagramFallbackToTelegram(
  title: string,
  caption: string,
  imageUrl: string | null,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const token = TELEGRAM_BOT_TOKEN || (await getAutomationSetting('telegram_bot_token'));
  const adminChat =
    process.env.ADMIN_TELEGRAM_CHAT_ID ||
    (await getAutomationSetting('admin_telegram_chat_id')) ||
    TELEGRAM_CHANNEL_ID ||
    (await getAutomationSetting('telegram_channel_id'));

  if (!token || !adminChat) {
    return { success: false, error: `اینستاگرام ناموفق (${reason}) و تلگرام مدیر هم تنظیم نشده` };
  }

  const esc = (t: string) =>
    t.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

  try {
    if (imageUrl) {
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChat,
          photo: resolveImageUrl(imageUrl),
          caption: `🖼 ${title.slice(0, 200)}`,
        }),
        signal: AbortSignal.timeout(30000),
      });
    }

    const text =
      `📸 <b>آماده انتشار دستی در اینستاگرام</b>\n` +
      `<i>دلیل: ${esc(reason)}</i>\n\n` +
      `👇 روی متن زیر بزنید تا کپی شود:\n\n` +
      `<pre>${esc(caption)}</pre>`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChat, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(30000),
    });
    const j = await res.json();
    if (j.ok) {
      console.log('📩 اینستاگرام: به حالت نیمه‌خودکار منتقل شد');
      return { success: true };
    }
    return { success: false, error: `تلگرام مدیر: ${JSON.stringify(j)}` };
  } catch (e: any) {
    return { success: false, error: `fallback تلگرام: ${e?.message || e}` };
  }
}

export async function sendToInstagram(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<{ success: boolean; error?: string }> {
  const caption =
    `🔥 ${title}\n\n📰 ${summary}\n\n🔗 ${link}\n\n` +
    `#TechNews #AI #Crypto #EhsanSalehi #فناوری #رمزارز #هوش_مصنوعی`;

  if (INSTAGRAM_MODE === 'off') {
    return { success: false, error: 'انتشار اینستاگرام غیرفعال است' };
  }
  if (INSTAGRAM_MODE === 'semi') {
    return instagramFallbackToTelegram(title, caption, imageUrl, 'حالت نیمه‌خودکار فعال است');
  }

  // ── مسیر ۱: رله روی هاستینگر ────────────────────────────
  // متا از IP ایران در دسترس نیست، پس اگر رله تنظیم شده اول از آن استفاده می‌کنیم.
  if (isRelayConfigured()) {
    const relayed = await publishViaRelay({
      channel: 'instagram',
      kind: 'image',
      mediaUrls: [resolveImageUrl(imageUrl)],
      caption,
      link,
    });
    if (relayed.ok) {
      console.log('✅ اینستاگرام از طریق رله منتشر شد:', relayed.result?.id);
      return { success: true };
    }
    console.warn('⚠️ رله اینستاگرام ناموفق:', relayed.error);
    return instagramFallbackToTelegram(title, caption, imageUrl, `رله ناموفق: ${relayed.error}`);
  }

  // ── مسیر ۲: تلاش مستقیم (اگر رله تنظیم نشده) ────────────
  const igToken =
    INSTAGRAM_ACCESS_TOKEN ||
    (await getAutomationSetting('instagram_access_token')) ||
    (await getAutomationSetting('fb_access_token'));
  const igAccount = INSTAGRAM_ACCOUNT_ID || (await getAutomationSetting('instagram_account_id'));

  if (!igToken || !igAccount) {
    return instagramFallbackToTelegram(title, caption, imageUrl, 'توکن یا شناسه اینستاگرام تنظیم نشده');
  }

  try {
    const fullImageUrl = resolveImageUrl(imageUrl);

    // توکن در body می‌رود نه در URL — جلوگیری از نشت در لاگ سرور
    const createRes = await fetch(`${IG_GRAPH}/${igAccount}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image_url: fullImageUrl, caption, access_token: igToken }),
      signal: AbortSignal.timeout(45000),
    });
    const createData = await createRes.json();

    if (!createRes.ok || !createData.id) {
      const msg = createData?.error?.message || JSON.stringify(createData);
      return instagramFallbackToTelegram(title, caption, imageUrl, `ساخت مدیا: ${msg}`);
    }

    // انتظار برای آماده شدن کانتینر — بدون این، انتشار تقریباً همیشه خطا می‌دهد
    const wait = await waitForInstagramContainer(createData.id, igToken);
    if (!wait.ready) {
      return instagramFallbackToTelegram(title, caption, imageUrl, `کانتینر: ${wait.error}`);
    }

    const publishRes = await fetch(`${IG_GRAPH}/${igAccount}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ creation_id: createData.id, access_token: igToken }),
      signal: AbortSignal.timeout(45000),
    });
    const publishData = await publishRes.json();

    if (publishRes.ok && publishData.id) {
      console.log('✅ اینستاگرام: پست منتشر شد (ID:', publishData.id, ')');
      return { success: true };
    }
    const msg = publishData?.error?.message || JSON.stringify(publishData);
    return instagramFallbackToTelegram(title, caption, imageUrl, `انتشار: ${msg}`);
  } catch (error: any) {
    return instagramFallbackToTelegram(title, caption, imageUrl, `شبکه: ${error?.message || error}`);
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
  // Skip if news is not translated to Persian
  if (!isPersianText(title) || !isPersianText(summary)) {
    console.log('skip: news not Persian:', title.slice(0, 50));
    return { success: false, results: {}, errors: { skip: 'News not translated to Persian' } };
  }

  const makeConfig = await getMakeSocialConfig();
  const makePlatforms = new Set((makeConfig.platforms || []).map((item) => item.toLowerCase()));
  const mcpConfig = await getMcpSocialConfig();
  const mcpPlatforms = new Set((mcpConfig.platforms || []).map((item) => item.toLowerCase()));
  const bridgePlatforms = makeConfig.configured && makePlatforms.size > 0 ? makePlatforms : mcpPlatforms;
  const bridgeMode = makeConfig.configured && makePlatforms.size > 0 ? 'make' : (mcpConfig.configured && mcpPlatforms.size > 0 ? 'mcp' : null);
  const skip = (platform: string) => bridgePlatforms.has(platform);

  const [tg, li, bl, et, rb, fb, wa, ig, bridgeResult] = await Promise.all([
    skip('telegram') ? Promise.resolve({ success: false, error: `handled-by-${bridgeMode}` }) : sendToTelegram(title, summary, imageUrl, link, sourceName),
    skip('linkedin') ? Promise.resolve({ success: false, error: `handled-by-${bridgeMode}` }) : sendToLinkedIn(title, summary, imageUrl, link),
    sendToBale(title, summary, imageUrl, link, sourceName),
    sendToEitaa(title, summary, imageUrl, link, sourceName),
    sendToRubika(title, summary, imageUrl, link, sourceName),
    skip('facebook') ? Promise.resolve({ success: false, error: `handled-by-${bridgeMode}` }) : sendToFacebook(title, summary, imageUrl, link),
    sendToWhatsAppChannel(title, summary, link),
    skip('instagram') ? Promise.resolve({ success: false, error: `handled-by-${bridgeMode}` }) : sendToInstagram(title, summary, imageUrl, link),
    bridgeMode === 'make'
      ? publishViaMakeSocialBridge({
          title,
          content: summary,
          imageUrl: resolveImageUrl(imageUrl),
          link,
          platforms: [...bridgePlatforms],
        })
      : bridgeMode === 'mcp'
        ? publishToMcpSocialBridge({
            title,
            content: summary,
            imageUrl: resolveImageUrl(imageUrl),
            link,
            platforms: [...bridgePlatforms],
            dryRun: false,
          })
        : Promise.resolve(null),
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
  if (!tg.success && tg.error && !String(tg.error).startsWith('handled-by-')) errors.telegram = tg.error;
  if (!li.success && li.error && !String(li.error).startsWith('handled-by-')) errors.linkedin = li.error;
  if (!bl.success && bl.error) errors.bale = bl.error;
  if (!et.success && et.error) errors.eitaa = et.error;
  if (!rb.success && rb.error) errors.rubika = rb.error;
  if (!fb.success && fb.error && !String(fb.error).startsWith('handled-by-')) errors.facebook = fb.error;
  if (!wa.success && wa.error) errors.whatsapp = wa.error;
  if (!ig.success && ig.error && !String(ig.error).startsWith('handled-by-')) errors.instagram = ig.error;

  if (bridgeResult) {
    for (const platform of Object.keys((bridgeResult as any).results || {})) {
      const item = ((bridgeResult as any).results as Record<string, any>)[platform];
      results[platform] = Boolean(item?.ok);
    }
    for (const [platform, message] of Object.entries((bridgeResult as any).errors || {})) {
      if (message) errors[platform] = message as string;
    }
    if (!bridgeResult.ok && (bridgeResult as any).message) {
      for (const platform of bridgePlatforms) {
        if (!results[platform]) errors[platform] ||= (bridgeResult as any).message;
      }
    }
  }

  const success = Object.values(results).some((val) => val === true);
  const bridgeMeta = bridgeResult
    ? {
        ok: bridgeResult.ok,
        mode: bridgeMode,
        message: (bridgeResult as any).message || null,
        deliveryId: (bridgeResult as any).deliveryId || null,
      }
    : null;

  try {
    await pool.execute(
      `UPDATE news_posts
       SET posted_to_social = ?
       WHERE id = ?`,
      [JSON.stringify({ results, errors, bridge: bridgeMeta }), newsId]
    );
  } catch (error: any) {
    console.error('⚠️ Social posting completed, but DB status update failed:', {
      newsId,
      code: typeof error?.code === 'string' ? error.code : 'UNKNOWN_DATABASE_ERROR',
    });
  }

  return { success, results, errors };
}
