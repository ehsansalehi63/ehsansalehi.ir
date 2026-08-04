import OpenAI from 'openai';
import { pool } from './db';
import { aiViaRelay, isRelayConfigured } from './relayClient';

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

  const apiKey = (process.env.OPENAI_API_KEY || await getAutomationSetting('openai_api_key') || '').trim();
  
  // If no API key, try relay AI gateway as fallback
  if (!apiKey || apiKey.includes('placeholder')) {
    if (isRelayConfigured()) {
      console.log('🔄 OPENAI_API_KEY not set, using relay AI gateway for translation...');
      try {
        const relayResult = await aiViaRelay({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional Persian/Farsi news translator. Translate the given title and content to natural, fluent Persian. Return ONLY JSON with title, summary (max 250 chars), and content fields.' },
            { role: 'user', content: `Title: ${title}\n\nContent: ${content}\n\nTranslate to Persian. Return JSON: {"title":"...","summary":"...","content":"..."}` }
          ],
          temperature: 0.3,
        });
        
        if (relayResult.ok && relayResult.data) {
          let parsed: any = null;
          if (typeof relayResult.data === 'string') {
            try { parsed = JSON.parse(relayResult.data); } catch {}
          } else if (relayResult.data.choices) {
            const msg = relayResult.data.choices[0]?.message?.content || '';
            try { parsed = JSON.parse(msg); } catch { parsed = { title: msg.slice(0, 200), summary: msg.slice(0, 250), content: msg }; }
          } else {
            parsed = relayResult.data;
          }
          
          if (parsed && parsed.title) {
            console.log('✅ Relay translation succeeded');
            return { title: parsed.title, summary: parsed.summary || parsed.content?.slice(0, 250) || '', content: parsed.content || '' };
          }
        }
        console.warn('⚠️ Relay AI returned no usable result');
      } catch (relayErr) {
        console.error('⚠️ Relay AI translation failed:', relayErr);
      }
    }
    return {
      title: title,
      summary: content.slice(0, 250),
      content: content,
    };
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
