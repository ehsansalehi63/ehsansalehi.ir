import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from '../../../lib/db';
import { verifyCron } from '../../../lib/auth';
import { analyzeAndTranslateNews } from '../../../lib/translateWithGPT';
import { FALLBACK_NEWS } from '../../../lib/fallbackNews';
import { postNewsToAllChannels } from '../../../lib/socialPoster';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RSS_FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://decrypt.co/feed',
  'https://news.bitcoin.com/feed/',
  'https://cryptoslate.com/feed/',
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://www.wired.com/feed/rss',
  'https://feeds.feedburner.com/zdnet/zdnet',
  'https://arstechnica.com/feed/',
  'https://www.engadget.com/rss.xml',
  'https://www.cnet.com/rss/news/',
  'https://www.digitaltrends.com/feed/',
  'https://www.techradar.com/rss',
];

const FEED_TIMEOUT_MS = 4500;
const EXTRACT_TIMEOUT_MS = 4000;
const TRANSLATE_TIMEOUT_MS = 9000;
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/smart-cover.png';

type ColumnRow = { Field: string };
type CandidateNews = {
  title: string;
  content: string;
  image: string;
  source_url: string;
  original_url: string;
  source_name: string;
  published_at: Date;
  feedUrl: string;
  score: number;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Surrogate-Control': 'no-store',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

function errorCode(error: unknown): string {
  return error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string'
    ? (error as any).code
    : 'UNKNOWN_ERROR';
}

function timeoutSignal(ms: number) {
  return AbortSignal.timeout(ms);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function detectCategory(title: string, content: string, feedUrl: string): string {
  const text = `${title} ${content} ${feedUrl}`.toLowerCase();
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain') || text.includes('coin') || text.includes('etf')) return 'رمزارز و بلاکچین';
  if (text.includes('ai ') || text.includes('artificial intelligence') || text.includes('chatgpt') || text.includes('openai') || text.includes('anthropic') || text.includes('llm')) return 'هوش مصنوعی';
  if (text.includes('security') || text.includes('cyber') || text.includes('hack') || text.includes('malware') || text.includes('ransomware')) return 'امنیت سایبری';
  if (text.includes('apple') || text.includes('samsung') || text.includes('phone') || text.includes('android') || text.includes('gpu') || text.includes('nvidia') || text.includes('intel')) return 'سخت‌افزار و گجت';
  return 'فناوری و رمزارز';
}

function absolutizeImage(image: string | undefined, pageUrl: string): string {
  if (!image) return DEFAULT_IMAGE;
  if (image.startsWith('http')) return image;
  try {
    return new URL(image, new URL(pageUrl).origin).toString();
  } catch {
    return DEFAULT_IMAGE;
  }
}

async function fetchFeedCandidates(feedUrl: string): Promise<CandidateNews[]> {
  const response = await axios.get(feedUrl, {
    timeout: FEED_TIMEOUT_MS,
    signal: timeoutSignal(FEED_TIMEOUT_MS + 500),
    responseType: 'text',
    maxContentLength: 1024 * 1024,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; EhsanSalehiNewsBot/1.0; +https://ehsansalehi.ir)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const parser = new Parser();
  const feed: any = await parser.parseString(String(response.data || ''));
  const items = (feed.items || []).slice(0, 2);

  return items
    .filter((item: any) => item?.title && item?.link)
    .map((item: any) => {
      const rawContent = item.contentSnippet || item.content || item['content:encoded'] || item.summary || '';
      const pubDate = item.pubDate || item.isoDate || item.published || item.updated;
      const publishedAt = pubDate ? new Date(pubDate) : new Date();
      const ageHours = Number.isFinite(publishedAt.getTime())
        ? (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)
        : 999;

      let score = 10;
      if (ageHours < 12) score += 60;
      else if (ageHours < 48) score += 35;
      if (/ai|openai|anthropic|security|cyber|bitcoin|crypto|ethereum|etf/i.test(`${item.title} ${rawContent}`)) score += 25;
      if (rawContent.length > 250) score += 10;

      return {
        title: String(item.title).trim(),
        content: String(rawContent).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        image: DEFAULT_IMAGE,
        source_url: String(item.link).trim(),
        original_url: String(item.link).trim(),
        source_name: feed.title || new URL(feedUrl).hostname,
        published_at: Number.isFinite(publishedAt.getTime()) ? publishedAt : new Date(),
        feedUrl,
        score,
      };
    });
}

async function extractFullContent(candidate: CandidateNews): Promise<CandidateNews> {
  try {
    const { data } = await axios.get(candidate.source_url, {
      timeout: EXTRACT_TIMEOUT_MS,
      signal: timeoutSignal(EXTRACT_TIMEOUT_MS + 500),
      responseType: 'text',
      maxContentLength: 1200 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EhsanSalehiNewsBot/1.0; +https://ehsansalehi.ir)',
        Accept: 'text/html,application/xhtml+xml',
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const $ = cheerio.load(String(data || ''));
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .newsletter, .related').remove();

    const image = absolutizeImage(
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('article img').first().attr('src'),
      candidate.source_url
    );

    let content = '';
    for (const selector of ['article .entry-content', 'article .post-content', 'article .content', 'main article', '.article-content', '.post-content', 'article', 'main']) {
      const text = $(selector).first().text().trim();
      if (text.length > content.length) content = text;
      if (content.length > 1200) break;
    }

    content = content.replace(/\s+/g, ' ').slice(0, 3000).trim();
    return {
      ...candidate,
      content: content.length > candidate.content.length ? content : candidate.content,
      image,
      score: candidate.score + (content.length > 700 ? 25 : 0) + (image !== DEFAULT_IMAGE ? 15 : 0),
    };
  } catch {
    return candidate;
  }
}

async function tableColumns() {
  const [columnRows] = await pool.execute('SHOW COLUMNS FROM news_posts');
  return new Set((columnRows as ColumnRow[]).map((column) => column.Field));
}

async function isDuplicate(available: Set<string>, title: string, originalUrl: string): Promise<boolean> {
  const conditions = ['`title` = ?'];
  const params: any[] = [title];
  if (available.has('original_url')) {
    conditions.push('`original_url` = ?');
    params.push(originalUrl);
  }
  if (available.has('source_url')) {
    conditions.push('`source_url` = ?');
    params.push(originalUrl);
  }

  const [existingRows] = await pool.execute(
    `SELECT id FROM news_posts WHERE ${conditions.join(' OR ')} LIMIT 1`,
    params
  );

  return (existingRows as any[]).length > 0;
}

async function insertNews(available: Set<string>, data: Record<string, any>) {
  const columns = Object.keys(data).filter((column) => available.has(column));
  if (!columns.includes('title')) {
    throw Object.assign(new Error('news_posts table does not contain title column'), { code: 'NEWS_SCHEMA_INVALID' });
  }

  const placeholders = columns.map(() => '?').join(', ');
  const [insertResult] = await pool.execute(
    `INSERT INTO news_posts (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`,
    columns.map((column) => data[column])
  );

  return (insertResult as any)?.insertId || null;
}

function fallbackSeedCandidate() {
  const item = FALLBACK_NEWS[0];
  return {
    title: item.title,
    content: item.content,
    image: new URL(item.image_url, 'https://ehsansalehi.ir').toString(),
    source_url: item.source_url,
    original_url: item.original_url,
    source_name: item.source_name,
    published_at: new Date(),
    feedUrl: 'static-fallback',
    score: 1,
  } satisfies CandidateNews;
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const cronError = verifyCron(request);
    if (cronError) return cronError;

    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';
    const seedFallback = searchParams.get('seedFallback') === 'true';
    const postSocial = searchParams.get('postSocial') !== 'false';
    const feedLimit = Math.min(Math.max(Number(searchParams.get('feeds') || (force ? 8 : 5)), 1), RSS_FEEDS.length);

    let candidates: CandidateNews[] = [];
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.slice(0, feedLimit).map((feedUrl) => fetchFeedCandidates(feedUrl))
    );

    for (const result of feedResults) {
      if (result.status === 'fulfilled') candidates.push(...result.value);
    }

    candidates.sort((a, b) => b.score - a.score);

    const enrichedResults = await Promise.allSettled(candidates.slice(0, 4).map((candidate) => extractFullContent(candidate)));
    const enriched = enrichedResults
      .filter((result): result is PromiseFulfilledResult<CandidateNews> => result.status === 'fulfilled')
      .map((result) => result.value)
      .sort((a, b) => b.score - a.score);

    let bestNews = enriched[0] || candidates[0] || null;
    if (!bestNews && seedFallback) bestNews = fallbackSeedCandidate();

    if (!bestNews) {
      return json({
        success: false,
        code: 'NO_FEED_CANDIDATE',
        message: 'هیچ خبر مناسبی از RSSها در بازه زمانی امن دریافت نشد. در صورت نیاز seedFallback=true را برای تزریق خبر داخلی اضافه کنید.',
        elapsedMs: Date.now() - startedAt,
      }, 200);
    }

    const available = await tableColumns();
    if (await isDuplicate(available, bestNews.title, bestNews.original_url)) {
      return json({
        success: true,
        code: 'DUPLICATE_NEWS',
        message: 'خبر انتخاب‌شده قبلاً در دیتابیس وجود دارد.',
        title: bestNews.title,
        elapsedMs: Date.now() - startedAt,
      });
    }

    const category = detectCategory(bestNews.title, bestNews.content, bestNews.feedUrl);
    const translated = await withTimeout(
      analyzeAndTranslateNews(bestNews.title, bestNews.content || bestNews.title, bestNews.source_name),
      TRANSLATE_TIMEOUT_MS,
      'TRANSLATE'
    ).catch(() => ({
      title: bestNews!.title,
      summary: (bestNews!.content || bestNews!.title).slice(0, 250),
      content: bestNews!.content || bestNews!.title,
    }));

    const newId = await insertNews(available, {
      title: translated.title || bestNews.title,
      content: translated.content || bestNews.content || bestNews.title,
      summary: translated.summary || (bestNews.content || bestNews.title).slice(0, 250),
      image_url: bestNews.image || DEFAULT_IMAGE,
      source_name: bestNews.source_name,
      source_url: bestNews.source_url,
      original_url: bestNews.original_url,
      published_at: bestNews.published_at,
      created_at: new Date(),
      updated_at: new Date(),
      is_published: true,
      category,
      view_count: 0,
    });

    let socialResults: string | null = null;
    if (postSocial && newId) {
      const link = `https://ehsansalehi.ir/news/${newId}`;
      postNewsToAllChannels(
        Number(newId),
        translated.title || bestNews.title,
        translated.summary || (bestNews.content || bestNews.title).slice(0, 250),
        bestNews.image || DEFAULT_IMAGE,
        link,
        bestNews.source_name || 'فناوری و رمزارز'
      ).catch((error) => console.error('Social post background error:', error));
      socialResults = 'started-in-background';
    }

    return json({
      success: true,
      message: 'خبر جدید بدون عبور از سقف زمانی Passenger ذخیره شد.',
      id: newId,
      title: translated.title || bestNews.title,
      category,
      source: bestNews.source_name,
      socialResults,
      elapsedMs: Date.now() - startedAt,
      feedStats: {
        requested: feedLimit,
        candidates: candidates.length,
        enriched: enriched.length,
      },
    });
  } catch (error: any) {
    const code = errorCode(error);
    console.error('❌ Cron news failed:', { code, message: error?.message || String(error) });

    return json({
      success: false,
      code: code === 'ER_ACCESS_DENIED_ERROR' ? 'DATABASE_AUTH_FAILED' : code,
      error: code === 'ER_ACCESS_DENIED_ERROR'
        ? 'اتصال دیتابیس برقرار نشد؛ رمز عبور یا Privilege کاربر MySQL در cPanel صحیح نیست.'
        : 'خطا در اجرای کرون اخبار. لاگ سرور را بررسی کنید.',
      elapsedMs: Date.now() - startedAt,
    }, code === 'ER_ACCESS_DENIED_ERROR' ? 503 : 500);
  }
}
