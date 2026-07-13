import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key-for-build',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.gapgpt.ir/v1',
});

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

  const prompt = `
  شما یک نویسنده و مترجم حرفه‌ای هستید که اخبار فناوری را به فارس روان و ج  
  عنوان اصلی خبر: "${title}"
  منبع: "${sourceName}"
  متن اصلی خبر: """
  ${content.slice(0, 2000)}
  """
  
  وظایف شما با لحنی گرم، صمیمی و حرفه‌ای:
  
  ۱. **عنوان جذاب فارسی**: عنوانی کوتاه (حداکثر ۱۲ کلمه) که مخاطب را مجذوب کند و حس کنجکاوی ایجاد کند.
  
  ۲. **خلاصه خبر (لید)**: ۲-۳ خط اول که اصل ماجرا را به‌صورت جذاب و خواندنی بیان کند. طوری که مخاطب حس کند داستانی جذاب در انتظارش است.
  
  ۳. **مشروح خبر**: ترجمه کامل خبر به فارسی روان و شیوا. از جملات کوتاه و رسا استفاده کن. سعی کن خبر را مانند یک داستان کوتاه روایت کنی. از کلمات تخصصی به‌جا استفاده کن اما آنقدر پیچیده نباشد که کاربر عادی متوجه نشود.
  
  خروجی را فقط به صورت JSON با این ساختار برگردان:
  {
    "title": "عنوان فارسی جذاب",
    "summary": "خلاصه خبر (۲-۳ خط)",
    "content": "مشروح خبر به فارسی روان"
  }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'شما یک نویسنده و مترجم حرفه‌ای هستید که با لحنی گرم و جذاب می‌نویسید. پاسخ را فقط به صورت JSON معتبر بدهید.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const result = response.choices[0].message.content;
    if (!result) throw new Error('پاسخی دریافت نشد');

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON نامعتبر');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('❌ GPT error:', error);
    return {
      title: title,
      summary: content.slice(0, 150) + '...',
      content: content,
    };
  }
}
