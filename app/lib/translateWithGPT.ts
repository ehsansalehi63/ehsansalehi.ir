import OpenAI from 'openai';
import { pool } from './db';

const RELAY_URL = (process.env.RELAY_URL || '').replace(/\/+$/, '');
const RELAY_SECRET = process.env.RELAY_SECRET || '';

// Fallback gate key for gapgpt.app (also stored in relay config)
const FALLBACK_GATE_KEY = 'sk-DGNaVGvNi7RhsW1FpsweR1GxrqQRq11wuJo53NSr1Fw1PMwE';

async function fetchGateKey(): Promise<string> {
  // Try relay config export first
  if (RELAY_URL && RELAY_SECRET) {
    try {
      const res = await fetch(`${RELAY_URL}?path=cfg-export&key=${encodeURIComponent(RELAY_SECRET)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.gate_key) return data.gate_key;
      }
    } catch {}
  }
  // Fall back to hardcoded key
  return FALLBACK_GATE_KEY;
}

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

  let apiKey = (process.env.OPENAI_API_KEY || await getAutomationSetting('openai_api_key') || '').trim();
  
  // If no API key, try to fetch gate_key from relay config
  if (!apiKey || apiKey.includes('placeholder')) {
    console.log('🔄 OPENAI_API_KEY not set, fetching gate_key from relay...');
    apiKey = await fetchGateKey();
    if (apiKey) {
      console.log('✅ Got gate_key from relay, using gapgpt.app directly');
    } else {
      console.warn('⚠️ No API key available, returning original English');
      return {
        title: title,
        summary: content.slice(0, 250),
        content: content,
      };
    }
  }

  try {
    const rawBaseUrl = process.env.OPENAI_BASE_URL || await getAutomationSetting('openai_base_url') || 'https://api.gapgpt.app/v1';
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: rawBaseUrl.replace('gapgpt.ir', 'gapgpt.app'),
      timeout: 15000,
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
      model: process.env.OPENAI_MODEL || await getAutomationSetting('openai_model') || 'gpt-4o-mini',
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
