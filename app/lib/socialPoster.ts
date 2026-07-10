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
// ۴. ارسال به ایتا (Eitaa)
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
// ۵. تابع اصلی: ارسال یک خبر به همه کانال‌ها
// ============================================================
export async function postNewsToAllChannels(
  newsId: number,
  title: string,
  summary: string,
  imageUrl: string | null,
  link: string
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {};

  results.telegram = await sendToTelegram(title, summary, imageUrl, link);
  results.bale = await sendToBale(title, summary, imageUrl, link);
  results.rubika = await sendToRubika(title, summary, imageUrl, link);
  results.eitaa = await sendToEitaa(title, summary, imageUrl, link);

  const success = Object.values(results).some(r => r === true);
  
  await pool.execute(
    `UPDATE news_posts 
     SET posted_to_social = ? 
     WHERE id = ?`,
    [JSON.stringify(results), newsId]
  );

  return { success, results };
}
