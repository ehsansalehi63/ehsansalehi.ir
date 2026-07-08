import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.gapgpt.ir/v1',
});

export async function analyzeAndTranslateNews(
  title: string,
  content: string,
  sourceName: string
): Promise<{ title: string; summary: string; content: string }> {
  // اگر محتوا خیلی کوتاه است، از همان عنوان استفاده کن
  if (!content || content.length < 20) {
    return {
      title: title,
      summary: title,
      content: title,
    };
  }

  const prompt = `
  شما یک مترجم خبر هستید. یک خبر انگلیسی را به فارسی روان و خلاصه ترجمه کنید.
  
  عنوان اصلی: "${title}"
  منبع: "${sourceName}"
  متن خبر: """
  ${content.slice(0, 1500)}
  """
  
  خواسته‌ها:
  ۱. یک عنوان جذاب فارسی (حداکثر ۱۰ کلمه)
  ۲. خلاصه خبر به فارسی (حداکثر ۱۰۰ کلمه)
  ۳. ترجمه کامل خبر (حداکثر ۳۰۰ کلمه)
  
  خروجی JSON:
  {
    "title": "عنوان فارسی",
    "summary": "خلاصه خبر",
    "content": "متن کامل ترجمه شده"
  }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'شما یک مترجم حرفه‌ای انگلیسی به فارسی هستید. پاسخ را فقط به صورت JSON معتبر بدهید.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 600, // کاهش برای سرعت بیشتر
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
