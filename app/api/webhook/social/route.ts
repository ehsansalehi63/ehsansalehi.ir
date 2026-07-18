import { NextRequest, NextResponse } from 'next/server';
import { postNewsToAllChannels } from '@/lib/socialPoster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const secret = body?.secret || request.headers.get('x-webhook-secret') || request.nextUrl.searchParams.get('secret');

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: '⛔ دسترسی وب‌هوک غیرمجاز (کلید امنیتی نادرست است)' }, { status: 401 });
    }

    const { id, title, summary, imageUrl, link, sourceName } = body;
    if (!title || !link) {
      return NextResponse.json({ success: false, error: 'عنوان (title) و لینک (link) الزامی هستند' }, { status: 400 });
    }

    const newsId = id || Math.floor(Math.random() * 90000) + 10000;
    console.log(`📡 دریافت سیگنال وب‌هوک اختصاصی (Make.com/In-House Engine) برای خبر: "${title}"`);

    const result = await postNewsToAllChannels(
      newsId,
      title,
      summary || title,
      imageUrl || 'https://ehsansalehi.ir/images/og-image.jpg',
      link,
      sourceName || 'پایگاه اخبار فناوری'
    );

    return NextResponse.json({
      success: true,
      message: '🚀 محتوا با موفقیت از طریق وب‌هوک داخلی روی تمام شبکه‌های اجتماعی متصل (تلگرام، لینکدین، بله، ایتا، فیسبوک، واتساپ، اینستاگرام) شلیک شد',
      results: result.results,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('❌ خطا در پردازش وب‌هوک:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal Webhook Error' }, { status: 500 });
  }
}
