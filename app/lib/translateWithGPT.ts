import OpenAI from 'openai';

export async function analyzeAndTranslateNews(
  title: string,
  content: string,
  sourceName: string
): Promise<{ title: string; summary: string; content: string }> {
  if (!content || content.length < 20) {
    return {
      title: title,
      summary: title,
      content: title,
    };
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey || apiKey.includes('placeholder')) {
    return {
      title: title,
      summary: content.slice(0, 250),
      content: content,
    };
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.gapgpt.ir/v1',
    });

    const prompt = `
    شما یک نویسنده و مترجم حرفه‌ای هستید که اخبار فناوری را به فارسی روان و جذاب ترجمه و خلاصه‌نویسی می‌کنید.
    عنوان اصلی خبر: "${title}"
    منبع: "${sourceName}"
    متن اصلی خبر: """
    ${content.slice(0, 2000)}
    """
    
    وظایف شما با لحنی گرم، صمیمی و حرفه‌ای:
    1. یک عنوان فارسی جذاب، تیتروار و سئوشده برای این خبر بنویسید (حداکثر ۱۰۰ کاراکتر).
    2. یک خلاصه ۲ یا ۳ خطی بسیار جذاب و آموزنده (حدود ۲۰۰ کاراکتر) به فارسی بنویسید که در شبکه‌های اجتماعی هم قابل انتشار باشد.
    3. کل متن خبر را به فارسی روان، شمرده، دقیق و با پاراگراف‌بندی مرتب ترجمه و بازنویسی کنید.
    
    پاسخ خود را حتماً در قالب JSON معتبر و با ساختار زیر ارسال کنید (بدون هیچ کد یا مارک‌داون اضافی):
    {
      "title": "عنوان فارسی جذاب",
      "summary": "خلاصه جذاب و کوتاه",
      "content": "متن کامل ترجمه و تحلیل‌شده"
    }
    `;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(resultText);

    return {
      title: parsed.title || title,
      summary: parsed.summary || content.slice(0, 200),
      content: parsed.content || content,
    };
  } catch (error) {
    console.error('❌ خطا در ترجمه با OpenAI:', error);
    return {
      title: title,
      summary: content.slice(0, 250),
      content: content,
    };
  }
}
