import { pool } from './db';

// Fallback gate key for gapgpt.app (also stored in relay config)
const FALLBACK_GATE_KEY = 'sk-DGNaVGvNi7RhsW1FpsweR1GxrqQRq11wuJo53NSr1Fw1PMwE';

async function getAutomationSetting(key: string): Promise<string> {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM automation_settings WHERE setting_key = ? LIMIT 1', [key]);
    return (rows as any[])[0]?.setting_value || '';
  } catch {
    return '';
  }
}

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

  const apiKey = FALLBACK_GATE_KEY;
  console.log('🔄 Using gate_key with gapgpt.app for translation');

  try {
    const prompt = `شما یک نویسنده و مترجم حرفه‌ای هستید که اخبار فناوری را به فارسی روان و جذاب ترجمه و خلاصه‌نویسی می‌کند.
عنوان اصلی خبر: "${title}"
منبع: "${sourceName}"
متن اصلی خبر: """
${content.slice(0, 2000)}
"""

وظایف شما:
1. یک عنوان فارسی جذاب و سئوشده (حداکثر ۱۰۰ کاراکتر).
2. یک خلاصه ۲-۳ خطی (حدود ۲۰۰ کاراکتر).
3. کل متن را به فارسی روان و دقیق ترجمه کنید.

پاسخ را در قالب JSON معتبر ارسال کنید (بدون مارک‌داون):
{"title":"عنوان","summary":"خلاصه","content":"متن کامل"}`;

    const model = process.env.OPENAI_MODEL || await getAutomationSetting('openai_model') || 'gpt-4o-mini';
    console.log('🔄 Calling gapgpt.app with model:', model);

    const res = await fetch('https://api.gapgpt.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(25000),
    });

    console.log('🔄 gapgpt.app response status:', res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error('❌ gapgpt.app error:', res.status, errText.slice(0, 200));
      throw new Error(`gapgpt.app returned ${res.status}: ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const resultText = data.choices?.[0]?.message?.content || '{}';

    // Try to extract JSON from the response
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      // Try to find JSON in the text
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON in response');
      }
    }

    const faTitle = String(parsed.title || title).trim();
    const faSummary = String(parsed.summary || content.slice(0, 200)).trim();
    const faContent = String(parsed.content || content).trim();

    console.log('✅ Translation succeeded:', faTitle.slice(0, 50));
    return {
      title: faTitle,
      summary: faSummary,
      content: faContent,
    };
  } catch (error) {
    console.error('❌ خطا در ترجمه:', (error as Error)?.message || String(error));
    return {
      title: title,
      summary: content.slice(0, 250),
      content: content,
    };
  }
}
