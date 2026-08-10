import { pool } from './db';
import { isMakeTranslateConfigured, translateViaMake } from './makeTranslateClient';

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

  if (await isMakeTranslateConfigured()) {
    try {
      const translated = await translateViaMake({ title, content, sourceName });
      console.log('✅ Translation succeeded via Make:', translated.title.slice(0, 50));
      return translated;
    } catch (error) {
      console.error('⚠️ Make translation failed, falling back to direct provider:', (error as Error)?.message || String(error));
    }
  }

  const configuredKey = process.env.OPENAI_API_KEY || await getAutomationSetting('openai_api_key');
  const apiKey = configuredKey || FALLBACK_GATE_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || await getAutomationSetting('openai_base_url') || 'https://api.gapgpt.app/v1').replace(/\/+$/, '');

  try {
    const prompt = `شما یک دبیر حرفه‌ای خبر هستید. خبر انگلیسی را به فارسی روان و استاندارد خبری تبدیل کن.
عنوان اصلی خبر: "${title}"
منبع: "${sourceName}"
متن اصلی خبر: """
${content.slice(0, 2500)}
"""

خروجی باید کاملاً فارسی باشد و این شروط را رعایت کند:
1. title: فقط فارسی، جذاب، خبری، حداکثر ۱۰۰ کاراکتر.
2. summary: فقط فارسی، ۲ تا ۳ جمله، حداکثر ۲۵۰ کاراکتر.
3. content: فقط فارسی، بدون انگلیسی‌نویسی غیرضروری، روان و کامل.
4. هیچ توضیح اضافه، markdown، code fence یا متن بیرون از JSON نده.

فقط این JSON را برگردان:
{"title":"...","summary":"...","content":"..."}`;

    const model = process.env.OPENAI_MODEL || await getAutomationSetting('openai_model') || 'gpt-4o-mini';
    console.log('🔄 Calling translation provider:', { baseUrl, model, configuredKey: Boolean(configuredKey) });

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    console.log('🔄 Translation provider response status:', res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error('❌ Translation provider error:', res.status, errText.slice(0, 200));
      throw new Error(`translation provider returned ${res.status}: ${errText.slice(0, 120)}`);
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
