import { createCanvas, loadImage } from 'canvas';

const COVER_WIDTH = 1280;
const COVER_HEIGHT = 720;
const LOGO_URL = 'https://ehsansalehi.ir/images/logo-transparent.png';
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/smart-cover.png';

// تابع کمکی برای دانلود با تایم‌اوت و خطاگیری
async function safeFetchImage(url: string, fallbackUrl?: string): Promise<Buffer> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // ۸ ثانیه تایم‌اوت

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
    
    // اگر fallback وجود داشت، آن را امتحان کن
    if (fallbackUrl) {
      try {
        const fallbackResponse = await fetch(fallbackUrl);
        if (fallbackResponse.ok) {
          return Buffer.from(await fallbackResponse.arrayBuffer());
        }
      } catch {}
    }
    
    // در نهایت یک تصویر خالی (یا placeholder) برمی‌گردانیم
    // یا همان DEFAULT_IMAGE را دوباره امتحان می‌کنیم
    throw new Error('Failed to load image after fallback');
  }
}

export async function createSmartCover(
  newsImageUrl: string | null,
  title: string,
  sourceName: string
): Promise<Buffer> {
  // ۱. تعیین آدرس تصویر خبر
  let imageUrl = newsImageUrl && !newsImageUrl.includes('placehold') 
    ? newsImageUrl 
    : DEFAULT_IMAGE;

  // ۲. دانلود تصویر خبر (با fallback)
  let imageBuffer: Buffer;
  try {
    imageBuffer = await safeFetchImage(imageUrl, DEFAULT_IMAGE);
  } catch {
    // اگر همه چیز failed شد، یک تصویر placeholder ساده با canvas بساز
    const canvas = createCanvas(COVER_WIDTH, COVER_HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📰', COVER_WIDTH/2, COVER_HEIGHT/2 - 20);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('تصویر خبر در دسترس نیست', COVER_WIDTH/2, COVER_HEIGHT/2 + 40);
    imageBuffer = canvas.toBuffer('image/png');
  }

  // ۳. دانلود لوگو (اختیاری - اگر خطا داد، بی‌تأثیر است)
  let logoBuffer: Buffer | null = null;
  try {
    logoBuffer = await safeFetchImage(LOGO_URL);
  } catch {
    console.warn('⚠️ لوگو دانلود نشد، ادامه بدون لوگو');
  }

  // ۴. ایجاد بوم اصلی
  const canvas = createCanvas(COVER_WIDTH, COVER_HEIGHT);
  const ctx = canvas.getContext('2d');

  // ۵. بارگذاری و کشیدن تصویر خبر (با برش مناسب)
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
    // در صورت خطا، پس‌زمینه ساده بکش
    ctx.fillStyle = '#0a0a2e';
    ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
  }

  // ۶. لایه شیشه‌ای
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

  // ۷. قاب حاشیه‌دار
  ctx.save();
  ctx.shadowColor = 'rgba(245, 158, 11, 0.15)';
  ctx.shadowBlur = 30;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  const r = 16;
  const fx = 30, fy = 30, fw = COVER_WIDTH - 60, fh = COVER_HEIGHT - 60;
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

  // ۸. لوگو (اگر دانلود شده باشد)
  if (logoBuffer) {
    try {
      const logoImage = await loadImage(logoBuffer);
      const logoSize = 120;
      const logoX = COVER_WIDTH - logoSize - 40;
      const logoY = 40;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch {}
  }

  // ۹. نام سایت و منبع
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '18px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('ehsansalehi.ir', COVER_WIDTH - 40, COVER_HEIGHT - 30);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`📰 ${sourceName || 'منبع'}`, 40, COVER_HEIGHT - 30);

  return canvas.toBuffer('image/png');
}
