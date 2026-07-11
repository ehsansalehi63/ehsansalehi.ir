import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

// ============================================================
// ثبت فونت وزیر (برای نوشته‌های فارسی)
// ============================================================
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Vazir.ttf');
  registerFont(fontPath, { family: 'Vazir' });
  console.log('✅ فونت وزیر با موفقیت ثبت شد');
} catch {
  console.warn('⚠️ فونت وزیر یافت نشد، از فونت پیش‌فرض استفاده می‌شود');
}

const COVER_WIDTH = 1280;
const COVER_HEIGHT = 720;
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/og-image.jpg';
const LOGO_URL = 'https://ehsansalehi.ir/images/logo-transparent.png';

// ============================================================
// دانلود امن تصویر
// ============================================================
async function safeFetchImage(url: string): Promise<Buffer> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.warn(`⚠️ خطا در دریافت تصویر: ${url}`, error.message);
    // ساخت placeholder
    const canvas = createCanvas(COVER_WIDTH, COVER_HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
    ctx.fillStyle = '#ff6b00';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📰', COVER_WIDTH / 2, COVER_HEIGHT / 2);
    return canvas.toBuffer('image/png');
  }
}

// ============================================================
// تابع اصلی: ساخت کاور با قاب شیشه‌ای
// ============================================================
export async function createSmartCover(
  newsImageUrl: string | null,
  title: string,
  sourceName: string
): Promise<Buffer> {
  // ۱. تعیین آدرس تصویر خبر
  const imageUrl = newsImageUrl && !newsImageUrl.includes('placehold')
    ? newsImageUrl
    : DEFAULT_IMAGE;

  // ۲. دانلود تصویر خبر و لوگو
  const [imageBuffer, logoBuffer] = await Promise.all([
    safeFetchImage(imageUrl),
    safeFetchImage(LOGO_URL).catch(() => null),
  ]);

  // ۳. ایجاد بوم (Canvas)
  const canvas = createCanvas(COVER_WIDTH, COVER_HEIGHT);
  const ctx = canvas.getContext('2d');

  // ۴. کشیدن تصویر خبر به‌عنوان پس‌زمینه (با برش مناسب)
  try {
    const newsImage = await loadImage(imageBuffer);
    const imgAspect = newsImage.width / newsImage.height;
    const coverAspect = COVER_WIDTH / COVER_HEIGHT;

    let drawW, drawH, drawX, drawY;
    if (imgAspect > coverAspect) {
      drawH = COVER_HEIGHT;
      drawW = drawH * imgAspect;
      drawX = (COVER_WIDTH - drawW) / 2;
      drawY = 0;
    } else {
      drawW = COVER_WIDTH;
      drawH = drawW / imgAspect;
      drawX = 0;
      drawY = (COVER_HEIGHT - drawH) / 2;
    }
    ctx.drawImage(newsImage, drawX, drawY, drawW, drawH);
  } catch {
    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
  }

  // ۵. لایه شیشه‌ای (Glass overlay) برای خوانایی بهتر
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

  // ====== قاب شیشه‌ای (Glass Frame) ======
  const framePadding = 30;
  const frameRadius = 20;
  const fx = framePadding;
  const fy = framePadding;
  const fw = COVER_WIDTH - framePadding * 2;
  const fh = COVER_HEIGHT - framePadding * 2;

  ctx.save();
  // سایه ملایم برای قاب
  ctx.shadowColor = 'rgba(255,107,0,0.1)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // بدنه قاب (شفاف با افکت شیشه‌ای)
  ctx.beginPath();
  ctx.moveTo(fx + frameRadius, fy);
  ctx.lineTo(fx + fw - frameRadius, fy);
  ctx.quadraticCurveTo(fx + fw, fy, fx + fw, fy + frameRadius);
  ctx.lineTo(fx + fw, fy + fh - frameRadius);
  ctx.quadraticCurveTo(fx + fw, fy + fh, fx + fw - frameRadius, fy + fh);
  ctx.lineTo(fx + frameRadius, fy + fh);
  ctx.quadraticCurveTo(fx, fy + fh, fx, fy + fh - frameRadius);
  ctx.lineTo(fx, fy + frameRadius);
  ctx.quadraticCurveTo(fx, fy, fx + frameRadius, fy);
  ctx.closePath();

  // پر کردن با شیشه
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fill();
  // حاشیه نارنجی نازک
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,107,0,0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ====== لوگو در بالا-چپ (با سایه) ======
  if (logoBuffer) {
    try {
      const logoImage = await loadImage(logoBuffer);
      const logoSize = 90;
      const logoX = fx + 30;
      const logoY = fy + 30;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 20;
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch {}
  }

  // ====== نوشته پایین: ehsansalehi.ir ======
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 15;
  ctx.fillText('ehsansalehi.ir', COVER_WIDTH / 2, COVER_HEIGHT - 40);

  // ====== عنوان خبر در پایین (با نوار شیشه‌ای) ======
  const barY = COVER_HEIGHT - 110;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  // نوار شیشه‌ای برای عنوان
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(60, barY, COVER_WIDTH - 120, 60, 12);
  ctx.fill();

  // متن عنوان
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Vazir, Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const maxTitleWidth = COVER_WIDTH - 180;
  let displayTitle = title;
  if (ctx.measureText(displayTitle).width > maxTitleWidth) {
    while (ctx.measureText(displayTitle + '...').width > maxTitleWidth) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle += '...';
  }
  ctx.fillText(displayTitle, COVER_WIDTH - 80, barY + 30);

  // ====== منبع خبر در پایین-چپ ======
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '14px Vazir, Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`منبع: ${sourceName || 'نامشخص'}`, 80, barY + 30);

  // ====== بازگشت تصویر ======
  return canvas.toBuffer('image/png');
}
