import Jimp from 'jimp';

export async function addWatermarkToImage(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('❌ بافر تصویر خالی است');
      return imageBuffer;
    }

    const image = await Jimp.read(imageBuffer);
    
    const targetWidth = 1200;
    const targetHeight = 628;
    image.resize(targetWidth, targetHeight, Jimp.RESIZE_BICUBIC);

    // 1. دانلود لوگوی سایت با تایم‌اوت ۳ ثانیه
    let logo: any = null;
    try {
      const logoRes = await fetch('https://ehsansalehi.ir/images/logo-transparent.png', {
        signal: AbortSignal.timeout(3000)
      });
      if (logoRes.ok) {
        const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
        logo = await Jimp.read(logoBuffer);
        logo.resize(76, 76, Jimp.RESIZE_BICUBIC);
      }
    } catch {
      console.warn('⚠️ لوگوی سایت در زمان تعیین‌شده دریافت نشد');
    }

    // 2. ایجاد نوار زیرین شیک و تیره (Bottom Banner Strip)
    const bottomStripHeight = 110;
    const overlay = new Jimp(targetWidth, bottomStripHeight, 0x0c0e16fa); // سرمه‌ای بسیار تیره با شفافیت ۹۸٪
    image.composite(overlay, 0, targetHeight - bottomStripHeight, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.95,
    } as any);

    // 3. ایجاد نوار باریک نارنجی/طلایی بالای نوار زیرین (Accent Border)
    const accentStrip = new Jimp(targetWidth, 4, 0xff6b00ff);
    image.composite(accentStrip, 0, targetHeight - bottomStripHeight, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1.0,
    } as any);

    // 4. بارگذاری فونت سفید بزرگ و خوانا (32px White Font)
    const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

    const brandText = 'ehsansalehi.ir';
    const subText = 'IT, AI & CRYPTO NEWS PORTAL';

    const brandWidth = Jimp.measureText(font32, brandText);
    const subWidth = Jimp.measureText(font16, subText);

    // موقعیت‌دهی متن برند و لوگو در سمت راست نوار زیرین
    const logoX = targetWidth - 100;
    const logoY = targetHeight - 92;

    const textX = logo ? logoX - brandWidth - 25 : targetWidth - brandWidth - 40;
    const textY = targetHeight - 82;

    image.print(font32, textX, textY, brandText);
    image.print(font16, textX + brandWidth - subWidth, textY + 40, subText);

    // 5. قرار دادن لوگو در سمت راست
    if (logo) {
      image.composite(logo, logoX, logoY, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 1.0,
      } as any);
    }

    // 6. قرار دادن بج کوچک در گوشه بالا سمت چپ (Top-Left Badge)
    const topBadge = new Jimp(240, 42, 0x000000cc);
    image.composite(topBadge, 20, 20, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.85,
    } as any);
    image.print(font16, 36, 32, '🔥 BREAKING TECH NEWS');

    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (error) {
    console.error('❌ خطا در ساخت کاور واترمارک‌دار:', error);
    return imageBuffer; // در صورت بروز خطا، تصویر اصلی بدون دستکاری برمی‌گردد
  }
}
