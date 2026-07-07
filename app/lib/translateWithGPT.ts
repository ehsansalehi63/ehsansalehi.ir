import OpenAI from 'openai';

// تنظیمات سرویس ایرانی (مثلاً GapGPT)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.gapgpt.ir/v1', // در صورت نیاز تغییر دهید
});

export async function analyzeAndTranslateNews(
  title: string,
  content: string,
  sourceName: string
): Promise<{ title: string; summary: string; content: string }> {
  const prompt = `
  شما یک مترجم و تحلیل‌گر خبر هستید. یک خبر به زبان انگلیسی دریافت می‌کنید.
  وظایف شما:
  ۱. **تحلیل**: آیا این خبر برای کاربران ایرانی (علاقه‌مند به فناوری، کسب‌وکار، علم روز) مفید، جذاب یا مرتبط است؟ اگر خبر خیلی تخصصی یا بی‌ربط است، باز هم ترجمه کنید اما در خلاصه اشاره کنید که "این خبر بیشتر برای متخصصان حوزه ... مناسب است".
  ۲. **خلاصه‌سازی**: خبر را به‌صورت خلاصه و روان به فارسی ترجمه کنید. خلاصه باید بین ۸۰ تا ۱۵۰ کلمه باشد.
  ۳. **لحن**: ترجمه را با لحن خودمانی، روان و کمی شوخ (اما حرفه‌ای) بنویسید. طوری که کاربر ایرانی احساس کند یک دوست آگاه دارد خبر را برایش تعریف می‌کند.
  ۴. **عنوان**: یک عنوان جذاب و سئوپسند به فارسی برای خبر بسازید (حداکثر ۱۰ کلمه).

  اطلاعات خبر:
  - عنوان اصلی: "${title}"
  - منبع: "${sourceName}"
  - متن کامل: """
  ${content.slice(0, 3000)}
  """

  خروجی را به‌صورت JSON با این ساختار برگردان:
  {
    "title": "عنوان فارسی جذاب",
    "summary": "خلاصه خبر به فارسی (۸۰-۱۵۰ کلمه، روان و شوخ)",
    "content": "ترجمه کامل‌تر خبر (در صورت نیاز، اما ترجیحاً همان خلاصه باشد)"
  }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'شما یک مترجم و تحلیل‌گر خبر هستید که به فارسی روان و شوخ می‌نویسید.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const result = response.choices[0].message.content;
    if (!result) throw new Error('پاسخی از GPT دریافت نشد');

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('خروجی JSON معتبر نیست');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('GPT Error:', error);
    return {
      title: title,
      summary: content.slice(0, 200) + '...',
      content: content,
    };
  }
}
