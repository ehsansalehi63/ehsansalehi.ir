import { Jimp } from 'jimp';

export async function addWatermarkToImage(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  try {
    // ۱. بارگذاری تصویر خبر
    const image = await Jimp.read(imageBuffer);
    
    // ۲. تغییر اندازه تصویر به ابعاد مناسب (با API جدید)
    const targetWidth = 1200;
    const targetHeight = 628;
    image.resize({ width: targetWidth, height: targetHeight });

    // ۳. بارگذاری لوگو
    let logo: any = null;
    try {
      const logoRes = await fetch('https://ehsansalehi.ir/images/logo-transparent.png');
      const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
      logo = await Jimp.read(logoBuffer);
      logo.resize({ width: 80, height: 80 });
    } catch {
      console.warn('⚠️ لوگو پیدا نشد، فقط متن نمایش داده می‌شود');
    }

    // ۴. افزودن لایه نیمه‌شفاف در پایین تصویر
    const overlay = new Jimp({ width: targetWidth, height: 100, color: 0x00000080 });
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

    // ۶. افزودن لوگو
    if (logo) {
      const logoX = targetWidth - 50 - textWidth - 40;
      const logoY = targetHeight - 75;
      image.composite(logo, logoX, logoY, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 0.9,
      });
    }

    // ۷. بازگشت بافر
    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (error) {
    console.error('❌ خطا در افزودن واترمارک:', error);
    return imageBuffer;
  }
}
