// ============================================================
// کاور استاتیک (برای رفع خطاهای فونت و تصویر)
// ============================================================
const STATIC_COVER_URL = 'https://ehsansalehi.ir/images/og-image.jpg';

export async function createSmartCover(
  newsImageUrl: string | null,
  title: string,
  sourceName: string
): Promise<Buffer> {
  // همیشه تصویر کاور استاتیک را برمی‌گردانیم
  const response = await fetch(STATIC_COVER_URL);
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}
