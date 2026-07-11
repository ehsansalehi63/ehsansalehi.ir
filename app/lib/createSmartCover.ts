import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

// ============================================================
// ثبت فونت وزیر (فارسی)
// ============================================================
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Vazir.ttf');
  registerFont(fontPath, { family: 'Vazir' });
  console.log('✅ فونت وزیر با موفقیت ثبت شد');
} catch (err) {
  console.warn('⚠️ فونت وزیر یافت نشد، از فونت پیش‌فرض استفاده می‌شود');
}

const COVER_WIDTH = 1280;
const COVER_HEIGHT = 720;
const LOGO_URL = 'https://ehsansalehi.ir/images/logo-transparent.png';
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/smart-cover.png';

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ خطا در دریافت تصویر: ${url}`, errorMessage);
    
    // ساخت تصویر placeholder
    const canvas = createCanvas(COVER_WIDTH, COVER_HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 60px Vazir, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📰', COVER_WIDTH / 2, COVER_HEIGHT / 2);
    ctx.font = '24px Vazir, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('تصویر در دسترس نیست', COVER_WIDTH / 2, COVER_HEIGHT / 2 + 60);
    return canvas.toBuffer('image/png');
  }
}

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

  // ۵. لایه شیشه‌ای برای خوانایی بهتر
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

  // ۶. قاب حاشیه‌دار (Glass-morphism)
  ctx.save();
  ctx.shadowColor = 'rgba(245, 158, 11, 0.1)';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  const r = 16;
  const fx = 25, fy = 25, fw = COVER_WIDTH - 50, fh = COVER_HEIGHT - 50;
  ctx.beginPath();
  ctx.moveTo(fx + r, fy);
  ctx.lineTo(fx + fw - r, fy);
  ctx.quadraticCurveTo(fx + fw, fy, fx + fw, fy + r);
  ctx.lineTo(fx + fw, fy + fh - r);
  ctx.quadraticCurveTo(fx + fw, fy + fh, fx + fw - r, fy + fh);
  ctx.lineTo(fx + r, fy + fh);
  ctx.quadraticCurveTo(fx, fy + fh, fx, fy + fh - r);
  ctx.lineTo(fx, fy + r);
  ctx.quadraticCurveTo(fx, fy, fx + r, fy);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // ۷. نوار شیشه‌ای پایین برای نوشته‌ها
  const barY = COVER_HEIGHT - 110;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.roundRect(40, barY, COVER_WIDTH - 80, 80, 12);
  ctx.fill();

  // ۸. خط جداکننده طلایی
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, barY + 40);
  ctx.lineTo(COVER_WIDTH - 60, barY + 40);
  ctx.stroke();

  // ۹. عنوان خبر (به فارسی با فونت وزیر)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Vazir, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const maxTitleWidth = COVER_WIDTH - 200;
  let displayTitle = title;
  if (ctx.measureText(displayTitle).width > maxTitleWidth) {
    while (ctx.measureText(displayTitle + '...').width > maxTitleWidth) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle += '...';
  }
  ctx.fillText(displayTitle, COVER_WIDTH - 50, barY + 22);

  // ۱۰. منبع خبر (به فارسی با فونت وزیر)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '14px Vazir, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`منبع: ${sourceName || 'نامشخص'}`, 60, barY + 22);

  // ۱۱. نام سایت (به انگلیسی - بدون مشکل فونت)
  ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.font = '14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('ehsansalehi.ir', COVER_WIDTH - 50, barY + 68);

  // ۱۲. لوگو در بالا-چپ (اگر وجود داشته باشد)
  if (logoBuffer) {
    try {
      const logoImage = await loadImage(logoBuffer);
      const logoSize = 80;
      const logoX = 40;
      const logoY = 40;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 15;
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch {}
  }

  // ۱۳. بازگشت تصویر به‌صورت Buffer
  return canvas.toBuffer('image/png');
}
