const COVER_WIDTH = 1280;
const COVER_HEIGHT = 720;
const IMAGE_PADDING = 30;
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/smart-cover.png';

export async function createSmartCover(
  newsImageUrl: string | null,
  title: string,
  sourceName: string
): Promise<Buffer> {
  const imageUrl = newsImageUrl && !newsImageUrl.includes('placehold') 
    ? newsImageUrl 
    : DEFAULT_IMAGE;

  // دانلود تصویر
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // تشخیص محیط: آیا در Vercel هستیم؟
  const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  if (isVercel) {
    try {
      // dynamic import canvas
      const { createCanvas, loadImage } = await import('canvas');
      return await createSmartCoverWithCanvas(createCanvas, loadImage, imageBuffer, title, sourceName);
    } catch (err) {
      console.error('❌ Canvas failed, using Jimp fallback:', err);
    }
  }

  // Fallback: استفاده از Jimp
  const Jimp = await import('jimp');
  return await createFallbackCover(Jimp.default || Jimp, imageBuffer);
}

// ============================================================
// کاور هوشمند با canvas
// ============================================================
async function createSmartCoverWithCanvas(
  createCanvas: any,
  loadImage: any,
  imageBuffer: Buffer,
  title: string,
  sourceName: string
): Promise<Buffer> {
  const canvas = createCanvas(COVER_WIDTH, COVER_HEIGHT);
  const ctx = canvas.getContext('2d');

  // پس‌زمینه
  const grad = ctx.createLinearGradient(0, 0, COVER_WIDTH, COVER_HEIGHT);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(0.5, '#1a1a2e');
  grad.addColorStop(1, '#16213e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

  // تصویر خبر
  const newsImage = await loadImage(imageBuffer);
  const imgAspect = newsImage.width / newsImage.height;
  const coverAspect = (COVER_WIDTH - IMAGE_PADDING * 2) / (COVER_HEIGHT - IMAGE_PADDING * 2 - 120);

  let drawW, drawH, drawX, drawY;
  if (imgAspect > coverAspect) {
    drawH = COVER_HEIGHT - IMAGE_PADDING * 2 - 120;
    drawW = drawH * imgAspect;
    drawX = IMAGE_PADDING + (COVER_WIDTH - IMAGE_PADDING * 2 - drawW) / 2;
    drawY = IMAGE_PADDING + 40;
  } else {
    drawW = COVER_WIDTH - IMAGE_PADDING * 2;
    drawH = drawW / imgAspect;
    drawX = IMAGE_PADDING;
    drawY = IMAGE_PADDING + 40 + (COVER_HEIGHT - IMAGE_PADDING * 2 - 120 - drawH) / 2;
  }
  ctx.drawImage(newsImage, drawX, drawY, drawW, drawH);

  // قاب
  ctx.save();
  ctx.shadowColor = 'rgba(245,158,11,0.15)';
  ctx.shadowBlur = 40;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  const r = 16, fx = 40, fy = 40, fw = COVER_WIDTH - 80, fh = COVER_HEIGHT - 80;
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

  // نوار پایین
  const barY = COVER_HEIGHT - 130;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(40, barY, COVER_WIDTH - 80, 90, 12);
  ctx.fill();

  ctx.strokeStyle = 'rgba(245,158,11,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, barY + 70);
  ctx.lineTo(COVER_WIDTH - 60, barY + 70);
  ctx.stroke();

  // عنوان
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Vazirmatn", "Vazir", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const maxTitleWidth = COVER_WIDTH - 120;
  let displayTitle = title;
  if (ctx.measureText(displayTitle).width > maxTitleWidth) {
    while (ctx.measureText(displayTitle + '...').width > maxTitleWidth) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle += '...';
  }
  ctx.fillText(displayTitle, COVER_WIDTH - 50, barY + 30);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '14px "Vazirmatn", "Vazir", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`منبع: ${sourceName || 'نامشخص'}`, 60, barY + 30);

  ctx.fillStyle = 'rgba(245,158,11,0.6)';
  ctx.font = '12px "Vazirmatn", "Vazir", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ehsansalehi.ir', COVER_WIDTH - 50, barY + 80);

  // لوگو
  ctx.beginPath();
  ctx.arc(50, 50, 30, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,158,11,0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,158,11,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 28px "Vazirmatn", "Vazir", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ا', 50, 52);

  return canvas.toBuffer('image/png');
}

// ============================================================
// Fallback: کاور ساده با Jimp
// ============================================================
async function createFallbackCover(Jimp: any, imageBuffer: Buffer): Promise<Buffer> {
  const image = await Jimp.read(imageBuffer);
  image.resize(COVER_WIDTH, COVER_HEIGHT);
  return await image.getBufferAsync(Jimp.MIME_PNG);
}
