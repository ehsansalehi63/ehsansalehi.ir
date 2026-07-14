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

    // 1. ایجاد نوار زیرین شیک و سرمه‌ای تیره (Bottom Banner Strip)
    const bottomStripHeight = 125;
    const overlay = new Jimp(targetWidth, bottomStripHeight, 0x0c0e18fa); // سرمه‌ای تیره با شفافیت ۹۸٪
    image.composite(overlay, 0, targetHeight - bottomStripHeight, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.98,
    } as any);

    // 2. ایجاد حاشیه باریک نارنجی/طلایی در بالای نوار زیرین (Accent Border)
    const accentStrip = new Jimp(targetWidth, 5, 0xff6b00ff);
    image.composite(accentStrip, 0, targetHeight - bottomStripHeight, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1.0,
    } as any);

    // 3. ایجاد بج مشکی بالای تصویر برای خبر فوری (Top Badge Box)
    const topBadgeBox = new Jimp(280, 48, 0x000000e6);
    image.composite(topBadgeBox, 24, 24, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.9,
    } as any);

    // 4. دانلود و قرار دادن لوگوی سایت (logo-transparent.png)
    let logo: any = null;
    try {
      const logoRes = await fetch('https://ehsansalehi.ir/images/logo-transparent.png', {
        signal: AbortSignal.timeout(5000)
      });
      if (logoRes.ok) {
        const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
        logo = await Jimp.read(logoBuffer);
        logo.resize(92, 92, Jimp.RESIZE_BICUBIC);
      }
    } catch (err) {
      console.warn('⚠️ لوگوی سایت در زمان تعیین‌شده دریافت نشد:', err);
    }

    // 5. بارگذاری فونت‌های سفید از آدرس تضمینی unpkg (برای جلوگیری از خطای ENOENT در Vercel Serverless)
    let font32: any = null;
    let font16: any = null;
    try {
      font32 = await Jimp.loadFont('https://unpkg.com/@jimp/plugin-print@0.16.1/fonts/open-sans/open-sans-32-white/open-sans-32-white.fnt');
      font16 = await Jimp.loadFont('https://unpkg.com/@jimp/plugin-print@0.16.1/fonts/open-sans/open-sans-16-white/open-sans-16-white.fnt');
    } catch (fontErr) {
      console.warn('⚠️ دانلود فونت از unpkg با تاخیر مواجه شد، تلاش برای فونت محلی:', fontErr);
      try {
        font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
      } catch (e) {
        console.warn('⚠️ فونت محلی یافت نشد.');
      }
    }

    const brandText = 'ehsansalehi.ir';
    const subText = 'IT, AI & CRYPTO NEWS PORTAL';
    const topText = '🔥 TECH & CRYPTO NEWS';

    const logoX = targetWidth - 116;
    const logoY = targetHeight - 108;

    if (logo) {
      image.composite(logo, logoX, logoY, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 1.0,
      } as any);
      console.log('✅ واترمارک: لوگوی سایت با موفقیت روی کاور قرار گرفت');
    }

    if (font32 && font16) {
      const brandWidth = Jimp.measureText(font32, brandText);
      const subWidth = Jimp.measureText(font16, subText);

      const textX = logo ? logoX - brandWidth - 24 : targetWidth - brandWidth - 40;
      const textY = targetHeight - 96;

      image.print(font32, textX, textY, brandText);
      image.print(font16, textX + brandWidth - subWidth, textY + 42, subText);
      image.print(font16, 42, 38, topText);
      console.log('✅ واترمارک: متون برند و عنوان سایت روی کاور چاپ شد');
    }

    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (error) {
    console.error('❌ خطا در ساخت کاور واترمارک‌دار:', error);
    return imageBuffer;
  }
}
