import Jimp from 'jimp';

/**
 * اضافه کردن واترمارک (لوگو + متن) به تصویر خبر
 * @param imageBuffer - بافر تصویر اصلی
 * @param title - عنوان خبر (برای نمایش در صورت نیاز)
 * @returns بافر تصویر با واترمارک
 */
export async function addWatermarkToImage(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  try {
    // ۱. بارگذاری تصویر خبر
    const image = await Jimp.read(imageBuffer);
    
    // ۲. تغییر اندازه تصویر به ابعاد مناسب
    const targetWidth = 1200;
    const targetHeight = 628;
    image.resize(targetWidth, targetHeight);

    // ۳. بارگذاری لوگو (با پس‌زمینه شفاف)
    let logo: any = null;
    try {
      const logoRes = await fetch('https://ehsansalehi.ir/images/logo-transparent.png');
      const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
      logo = await Jimp.read(logoBuffer);
      logo.resize(80, 80);
    } catch {
      console.warn('⚠️ لوگو پیدا نشد، فقط متن نمایش داده می‌شود');
    }

    // ۴. افزودن لایه نیمه‌شفاف در پایین تصویر
    const overlay = new Jimp(targetWidth, 100, 0x00000080);
    image.composite(overlay, 0, targetHeight - 100, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.6,
    });

    // ۵. افزودن متن "ehsansalehi.ir"
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const text = 'ehsansalehi.ir';
    const textWidth = Jimp.measureText(font, text);
    const textX = targetWidth - textWidth - 20;
    const textY = targetHeight - 60;
    image.print(font, textX, textY, text);

    // ۶. افزودن لوگو در کنار متن
    if (logo) {
      const logoSize = 50;
      const logoX = targetWidth - logoSize - textWidth - 40;
      const logoY = targetHeight - 75;
      image.composite(logo, logoX, logoY, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 0.9,
      });
    }

    // ۷. بازگشت بافر تصویر
    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (error) {
    console.error('❌ خطا در افزودن واترمارک:', error);
    // در صورت خطا، تصویر اصلی را برگردان
    return imageBuffer;
  }
}
