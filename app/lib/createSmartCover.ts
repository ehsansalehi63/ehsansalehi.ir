import sharp, { ResizeOptions } from 'sharp';

// ============================================================
// تنظیمات کاور
// ============================================================
const COVER_WIDTH = 1280;
const COVER_HEIGHT = 720;
const IMAGE_PADDING = 30;
const CORNER_RADIUS = 16;
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/smart-cover.png';

// ============================================================
// تابع اصلی: ساخت کاور هوشمند با sharp
// ============================================================
export async function createSmartCover(
  newsImageUrl: string | null,
  title: string,
  sourceName: string
): Promise<Buffer> {
  // ۱. تعیین تصویر خبر
  const imageUrl = newsImageUrl && !newsImageUrl.includes('placehold') 
    ? newsImageUrl 
    : DEFAULT_IMAGE;

  // ۲. دانلود تصویر خبر
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // ۳. ایجاد پس‌زمینه گرادیانت با SVG
  const bgSvg = `
    <svg width="${COVER_WIDTH}" height="${COVER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a0a2e" />
          <stop offset="50%" stop-color="#1a1a2e" />
          <stop offset="100%" stop-color="#16213e" />
        </linearGradient>
        <pattern id="dots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.5" fill="rgba(245,158,11,0.04)" />
          <circle cx="40" cy="40" r="1" fill="rgba(245,158,11,0.03)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  `;

  const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  // ۴. آماده‌سازی تصویر خبر
  const imageSharp = sharp(imageBuffer);
  const metadata = await imageSharp.metadata();
  const imgAspect = metadata.width! / metadata.height!;
  const coverAspect = (COVER_WIDTH - IMAGE_PADDING * 2) / (COVER_HEIGHT - IMAGE_PADDING * 2 - 120);

  // محاسبه ابعاد resize
  let resizeWidth: number, resizeHeight: number;
  if (imgAspect > coverAspect) {
    resizeHeight = COVER_HEIGHT - IMAGE_PADDING * 2 - 120;
    resizeWidth = Math.round(resizeHeight * imgAspect);
  } else {
    resizeWidth = COVER_WIDTH - IMAGE_PADDING * 2;
    resizeHeight = Math.round(resizeWidth / imgAspect);
  }

  const resizedImage = await imageSharp
    .resize(resizeWidth, resizeHeight, { fit: 'cover', position: 'centre' })
    .toBuffer();

  // ۵. ترکیب تصویر روی پس‌زمینه
  const compositeBuffer = await sharp(bgBuffer)
    .composite([
      {
        input: resizedImage,
        top: IMAGE_PADDING + 40,
        left: IMAGE_PADDING,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer();

  // ۶. اضافه کردن متن‌ها با SVG
  const overlaySvg = `
    <svg width="${COVER_WIDTH}" height="${COVER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
          text {
            font-family: 'Vazirmatn', sans-serif;
            fill: #ffffff;
          }
        </style>
      </defs>
      <rect x="40" y="${COVER_HEIGHT - 130}" width="${COVER_WIDTH - 80}" height="90" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
      <line x1="60" y1="${COVER_HEIGHT - 60}" x2="${COVER_WIDTH - 60}" y2="${COVER_HEIGHT - 60}" stroke="rgba(245,158,11,0.3)" stroke-width="1.5" />
      <text x="${COVER_WIDTH - 50}" y="${COVER_HEIGHT - 90}" font-size="28" font-weight="700" text-anchor="end" letter-spacing="0.5">
        ${title.length > 60 ? title.slice(0, 60) + '...' : title}
      </text>
      <text x="60" y="${COVER_HEIGHT - 90}" font-size="14" fill="rgba(255,255,255,0.5)" text-anchor="start">
        منبع: ${sourceName || 'نامشخص'}
      </text>
      <text x="${COVER_WIDTH - 50}" y="${COVER_HEIGHT - 30}" font-size="12" fill="rgba(245,158,11,0.6)" text-anchor="end" font-weight="400">
        ehsansalehi.ir
      </text>
      <circle cx="50" cy="60" r="30" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" stroke-width="1.5" />
      <text x="50" y="72" font-size="28" fill="#f59e0b" text-anchor="middle" font-weight="900">ا</text>
    </svg>
  `;

  const finalBuffer = await sharp(compositeBuffer)
    .composite([
      {
        input: Buffer.from(overlaySvg),
        top: 0,
        left: 0,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer();

  return finalBuffer;
}
