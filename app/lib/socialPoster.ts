import { pool } from './db';

// ============================================================
// تنظیمات توکن‌ها - در Vercel Environment Variables تنظیم کنید
// ============================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
const BALE_BOT_TOKEN = process.env.BALE_BOT_TOKEN || '';
const BALE_CHANNEL_ID = process.env.BALE_CHANNEL_ID || '';
const RUBIKA_BOT_TOKEN = process.env.RUBIKA_BOT_TOKEN || '';
const RUBIKA_CHANNEL_ID = process.env.RUBIKA_CHANNEL_ID || '';
const EITAA_BOT_TOKEN = process.env.EITAA_BOT_TOKEN || '';
const EITAA_CHANNEL_ID = process.env.EITAA_CHANNEL_ID || '';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || '';
const INSTAGRAM_BUSINESS_ID = process.env.INSTAGRAM_BUSINESS_ID || '';

// ======================== جدید: واتساپ ========================
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_RECIPIENT_NUMBER = process.env.WHATSAPP_RECIPIENT_NUMBER || ''; // شماره گیرنده (اختیاری)

// ============================================================
// ۱. ارسال به تلگرام
// ============================================================
export async function sendToTelegram(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.log('⏭️ تلگرام: توکن یا کانال تنظیم نشده');
    return false;
  }

  try {
    const caption = `📰 *${title}*\n\n${summary}\n\n🔗 [مشاهده کامل خبر](${link})`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHANNEL_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    formData.append('disable_web_page_preview', 'false');

    const defaultImage = 'https://ehsansalehi.ir/images/og-image.jpg';
    formData.append('photo', imageUrl && !imageUrl.includes('placehold') ? imageUrl : defaultImage);

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ تلگرام: پست ارسال شد');
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
// ۲. ارسال به بله
// ============================================================
export async function sendToBale(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<boolean> {
  if (!BALE_BOT_TOKEN || !BALE_CHANNEL_ID) {
    console.log('⏭️ بله: توکن یا کانال تنظیم نشده');
    return false;
  }

  try {
    const caption = `📰 *${title}*\n\n${summary}\n\n🔗 [مشاهده کامل خبر](${link})`;
    const url = `https://api.bale.ai/bot${BALE_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', BALE_CHANNEL_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const defaultImage = 'https://ehsansalehi.ir/images/og-image.jpg';
    formData.append('photo', imageUrl && !imageUrl.includes('placehold') ? imageUrl : defaultImage);

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ بله: پست ارسال شد');
      return true;
    } else {
      console.error('❌ بله:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ بله error:', error);
    return false;
  }
}

// ============================================================
// ۳. ارسال به روبیکا
// ============================================================
export async function sendToRubika(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<boolean> {
  if (!RUBIKA_BOT_TOKEN || !RUBIKA_CHANNEL_ID) {
    console.log('⏭️ روبیکا: توکن یا کانال تنظیم نشده');
    return false;
  }

  try {
    const text = `📰 ${title}\n\n${summary}\n\n🔗 مشاهده کامل خبر: ${link}`;
    const url = `https://api.rubika.ir/bot${RUBIKA_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: RUBIKA_CHANNEL_ID,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ روبیکا: پست ارسال شد');
      return true;
    } else {
      console.error('❌ روبیکا:', result.description);
      return false;
    }
  } catch (error) {
    console.error('❌ روبیکا error:', error);
    return false;
  }
}

// ============================================================
// ۴. ارسال به اینستاگرام
// ============================================================
export async function sendToInstagram(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<boolean> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ID) {
    console.log('⏭️ اینستاگرام: توکن یا Business ID تنظیم نشده');
    return false;
  }

  try {
    const caption = `${title}\n\n${summary}\n\nلینک خبر: ${link}\n\n#تکنولوژی #اخبار_فناوری`;
    const image = imageUrl && !imageUrl.includes('placehold') ? imageUrl : 'https://ehsansalehi.ir/images/og-image.jpg';

    const containerUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_BUSINESS_ID}/media`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: image,
        caption: caption,
        access_token: INSTAGRAM_ACCESS_TOKEN,
      }),
    });
    const containerData = await containerRes.json();
    
    if (!containerData.id) {
      console.error('❌ اینستاگرام: ایجاد container失敗', containerData);
      return false;
    }

    const publishUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_BUSINESS_ID}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: INSTAGRAM_ACCESS_TOKEN,
      }),
    });
    const publishData = await publishRes.json();

    if (publishData.id) {
      console.log('✅ اینستاگرام: پست ارسال شد');
      return true;
    } else {
      console.error('❌ اینستاگرام:', publishData);
      return false;
    }
  } catch (error) {
    console.error('❌ اینستاگرام error:', error);
    return false;
  }
}

// ============================================================
// ۵. ارسال به ایتا (Eitaa)
// ============================================================
export async function sendToEitaa(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<boolean> {
  if (!EITAA_BOT_TOKEN || !EITAA_CHANNEL_ID) {
    console.log('⏭️ ایتا: توکن یا کانال تنظیم نشده');
    return false;
  }

  try {
    const caption = `📰 *${title}*\n\n${summary}\n\n🔗 [مشاهده کامل خبر](${link})`;
    const url = `https://eitaayar.ir/api/${EITAA_BOT_TOKEN}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', EITAA_CHANNEL_ID);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const defaultImage = 'https://ehsansalehi.ir/images/og-image.jpg';
    formData.append('photo', imageUrl && !imageUrl.includes('placehold') ? imageUrl : defaultImage);

    const response = await fetch(url, { method: 'POST', body: formData });
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ ایتا: پست ارسال شد');
      return true;
    } else {
      console.error('❌ ایتا:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ ایتا error:', error);
    return false;
  }
}

// ============================================================
// ۶. ارسال به واتساپ (WhatsApp Cloud API)
// ============================================================
export async function sendToWhatsApp(
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<boolean> {
  // اگر توکن یا شماره وجود نداشت، از لینک wa.me استفاده کن (روش جایگزین)
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log('ℹ️ واتساپ: توکن یا شماره تنظیم نشده، از لینک wa.me استفاده می‌شود');
    // لینک واتساپ برای اشتراک‌گذاری (می‌توانید این لینک را در کانال قرار دهید)
    const waLink = `https://wa.me/?text=${encodeURIComponent(`📰 ${title}\n\n${summary}\n\nمشاهده کامل خبر: ${link}`)}`;
    console.log(`🔗 لینک واتساپ: ${waLink}`);
    return false; // چون ارسال خودکار انجام نشد
  }

  try {
    // ارسال پیام به یک شماره خاص با استفاده از WhatsApp Cloud API
    const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const text = `📰 ${title}\n\n${summary}\n\nمشاهده کامل خبر: ${link}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: WHATSAPP_RECIPIENT_NUMBER || '', // شماره گیرنده
        type: 'text',
        text: { body: text },
      }),
    });

    const result = await response.json();
    if (result.messages && result.messages[0].id) {
      console.log('✅ واتساپ: پیام ارسال شد');
      return true;
    } else {
      console.error('❌ واتساپ:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ واتساپ error:', error);
    return false;
  }
}

// ============================================================
// ۷. تابع اصلی: ارسال یک خبر به همه کانال‌ها
// ============================================================
export async function postNewsToAllChannels(
  newsId: number,
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {};

  // ارسال به همه پلتفرم‌ها
  results.telegram = await sendToTelegram(title, summary, imageUrl, link);
  results.bale = await sendToBale(title, summary, imageUrl, link);
  results.rubika = await sendToRubika(title, summary, imageUrl, link);
  results.eitaa = await sendToEitaa(title, summary, imageUrl, link);
  results.instagram = await sendToInstagram(title, summary, imageUrl, link);
  results.whatsapp = await sendToWhatsApp(title, summary, imageUrl, link); // اضافه شد

  const success = Object.values(results).some(r => r === true);
  
  await pool.execute(
    `UPDATE news_posts 
     SET posted_to_social = ? 
     WHERE id = ?`,
    [JSON.stringify(results), newsId]
  );

  return { success, results };
}
