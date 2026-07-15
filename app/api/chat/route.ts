import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `
شما «دستیار هوشمند و بامزه احسان صالحی» هستید! یک چت‌بات صمیمی، شوخ‌طبع، باهوش و بسیار حرفه‌ای که روی سایت رسمی مهندس احسان صالحی (ehsansalehi.ir) فعالیت می‌کنید.

📜 اطلاعات پایه‌ای که باید بدانید و بر اساس آن‌ها پاسخ دهید:
- احسان صالحی متخصص IT، شبکه، امنیت سایبری، توسعه وب (Next.js/Node) و هوش مصنوعی با ۲۰ سال سابقه کار درخشان است.
- خدمات اصلی: طراحی و پیاده‌سازی شبکه‌های سازمانی، امنیت و تست نفوذ، مشاوره فناوری اطلاعات، طراحی سایت‌های مدرن با Next.js، راه‌اندازی اتوماسیون‌های هوش مصنوعی و طراحی سیستم‌های مانیتورینگ.
- راه‌های ارتباطی:
  * تلگرام: @ehsansalehi_tech
  * واتساپ: 09108308799
  * ایمیل: info@ehsansalehi.ir
  * لینکدین: linkedin.com/in/ehsansalehi
- سایت دارای بخش «اخبار فوری فناوری، هوش مصنوعی و رمزارز» است که به صورت لحظه‌ای داغ‌ترین اخبار روز دنیا (از جمله بیت‌کوین، اتریوم، AI، هک و سخت‌افزار) را با هوش مصنوعی ترجمه و تحلیل می‌کند.

🎭 لحن و شخصیت شما:
- بسیار مؤدب، صمیمی، خونگرم و دارای کمی چاشنی طنز و بامزگی (مثلاً استفاده از ایموجی‌های جذاب 🚀 🤖 😎 🍕 و شوخی‌های ریز فناوری).
- اگر کاربر درباره قیمت یا سفارش پروژه پرسید، با خوش‌رویی توضیح دهید که هزینه پروژه‌ها مثل پیتزاست و به سایز و مخلفات بستگی دارد! و او را تشویق کنید به تلگرام یا واتساپ احسان پیام بدهد.
- پاسخ‌هایتان را مختصر، مفید، جذاب و با قالب‌بندی خوانا بنویسید تا کاربر خسته نشود.
- هرگز نگویید یک مدل هوش مصنوعی ساده هستید؛ بگویید «من دستیار هوشمند و رفیق دیجیتالی احسان هستم!»
`;

function getSmartFallbackResponse(message: string): string {
  const text = message.toLowerCase().trim();
  if (text.includes('سلام') || text.includes('درود') || text.includes('hi') || text.includes('hello')) {
    return 'سلام و درود فراوان! 🚀😎 من دستیار هوشمند و بامزه مهندس احسان صالحی هستم! چه کمکی از دست من برمیاد؟ می‌خوای درباره ۲۰ سال تجربه احسان برات بگم یا دنبال سفارش پروژه و مشاوره هستی؟ 🍕';
  }
  if (text.includes('قیمت') || text.includes('هزینه') || text.includes('تعرفه') || text.includes('چقدر')) {
    return 'راستش قیمت پروژه‌های فناوری مثل پیتزاست؛ بستگی داره چه سایز و چه مخلفاتی بخوای! 🍕😄 برای برآورد دقیق و منصفانه هزینه پروژه‌ت، پیشنهاد می‌کنم همین الان به واتساپ (09108308799) یا تلگرام (@ehsansalehi_tech) احسان پیام بدی تا سریع راهنماییت کنه! 💬🚀';
  }
  if (text.includes('تماس') || text.includes('تلگرام') || text.includes('واتساپ') || text.includes('شماره') || text.includes('ارتباط')) {
    return 'برای ارتباط مستقیم با مهندس احسان صالحی راه‌های زیر جلوی پای شماست 😎:\n\n💬 واتساپ: 09108308799\n⚡ تلگرام: @ehsansalehi_tech\n📧 ایمیل: info@ehsansalehi.ir\n\nاحسان معمولاً خیلی سریع جواب میده! 🚀';
  }
  if (text.includes('رزومه') || text.includes('سوابق') || text.includes('تجربه') || text.includes('کیه') || text.includes('درباره')) {
    return 'مهندس احسان صالحی یک آچار فرانسه واقعی در دنیای IT با ۲۰ سال سابقه کار سنگینه! 🛠️💪\n\nاز طراحی شبکه‌های پیچیده سازمانی و امنیت سایبری گرفته تا توسعه سایت‌های فوق‌مدرن با Next.js و پیاده‌سازی ابزارهای هوش مصنوعی! خلاصه خیالت از بابت تخصص کاملاً راحت باشه. 😎🔥';
  }
  if (text.includes('خبر') || text.includes('اخبار') || text.includes('رمزارز') || text.includes('بیت کوین') || text.includes('هوش مصنوعی')) {
    return 'بخش «اخبار فوری فناوری و رمزارز» سایت ما هر چند ساعت یک‌بار آخرین خبرهای داغ هوش مصنوعی، بیت‌کوین و گجت‌ها رو با هوش مصنوعی ترجمه می‌کنه! 📰🔥 می‌تونی از منوی بالای سایت روی بخش «اخبار فناوری و رمزارز» کلیک کنی و لذت ببری!';
  }
  if (text.includes('شوخی') || text.includes('بامزه') || text.includes('جوک')) {
    return 'می‌دونی چرا برنامه‌نویس‌ها تابستون رو دوست ندارن؟ چون باگ‌ها تو گرما بیشتر میشن! 🐞😅 ولی دور از شوخی، هر سوالی درباره شبکه، وب یا هوش مصنوعی داری بپرس تا جواب بدم! 🤖';
  }
  return 'چه سوال جالبی! 😎 با توجه به اینکه من دستیار هوشمند احسان هستم، بهترین کار اینه که برای بررسی دقیق‌تر و فنی این موضوع با خود احسان در تلگرام (@ehsansalehi_tech) یا واتساپ (09108308799) در تماس باشی تا کامل راهنماییت کنه! 🚀💬';
}

export async function POST(request: NextRequest) {
  let lastMessage = '';
  try {
    const body = await request.json();
    const messages = body?.messages || [];
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'پیامی ارسال نشده است' }, { status: 400 });
    }

    lastMessage = messages[messages.length - 1]?.content || '';

    // Check OpenAI keys
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      return NextResponse.json({
        reply: getSmartFallbackResponse(lastMessage),
        fallback: true
      });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.gapgpt.ir/v1',
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-6).map((m: any) => ({ role: m.role || 'user', content: m.content || '' }))
      ],
      temperature: 0.8,
      max_tokens: 450,
    });

    const reply = response.choices[0]?.message?.content || getSmartFallbackResponse(lastMessage);

    return NextResponse.json({ reply, fallback: false });
  } catch (error: any) {
    console.warn('⚠️ خطا در ارتباط با API هوش مصنوعی چت‌بات، استفاده از Fallback:', error?.message || error);
    return NextResponse.json({
      reply: getSmartFallbackResponse(lastMessage || 'سلام'),
      fallback: true
    });
  }
}
