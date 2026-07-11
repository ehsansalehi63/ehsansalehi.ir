import Jimp from 'jimp';

export async function addWatermarkToImage(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  try {
    // ۱. بارگذاری تصویر خبر
    const image = await Jimp.read(imageBuffer);
    
    // ۲. تغییر اندازه تصویر
    const targetWidth = 1200;
    const targetHeight = 628;
    image.resize(targetWidth, targetHeight);

    // ۳. بارگذاری لوگو
    let logo: any = null;
    try {
      const logoRes = await fetch('https://ehsansalehi.ir/images/logo-transparent.png');
      const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
      logo = await Jimp.read(logoBuffer);
      logo.resize(80, 80);
    } catch {
      console.warn('⚠️ لوگو پیدا نشد');
    }

    // ۴. افزودن لایه نیمه‌شفاف در پایین
    const overlay = new Jimp(targetWidth, 100, 0x00000080);
    image.composite(overlay, 0, targetHeight - 100, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.6,
    });

    // ۵. افزودن متن
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
    console.error('❌ خطا در واترمارک:', error);
    return imageBuffer;
  }
}
