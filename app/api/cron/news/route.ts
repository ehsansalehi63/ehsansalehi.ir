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
export const maxDuration = 120;

const RSS_FEEDS = [
  // Crypto / blockchain
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
  'https://decrypt.co/feed',
  'https://news.bitcoin.com/feed/',
  'https://cryptoslate.com/feed/',
  'https://www.theblock.co/rss.xml',

  // AI-first sources
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://venturebeat.com/category/ai/feed/',
  'https://www.technologyreview.com/topic/artificial-intelligence/feed',
  'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
  'https://blog.google/technology/ai/rss/',
  'https://openai.com/news/rss.xml',
  'https://www.anthropic.com/news/rss.xml',

  // Broad, reputable technology sources
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

const FEED_TIMEOUT_MS = 5500;
const EXTRACT_TIMEOUT_MS = 5000;
const TRANSLATE_TIMEOUT_MS = 15000;
const DEFAULT_IMAGE = 'https://ehsansalehi.ir/images/smart-cover.png';
const MAX_INSERT_PER_RUN = 10;
const MAX_SOCIAL_PER_RUN = 10;

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

type InsertedNews = {
  id: number | string | null;
  title: string;
  summary: string;
  image: string;
  source_name: string;
  category: string;
  link: string | null;
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

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
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
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain') || text.includes('coin') || text.includes('etf') || text.includes('token')) return 'رمزارز و بلاکچین';
  if (text.includes('ai ') || text.includes('artificial intelligence') || text.includes('chatgpt') || text.includes('openai') || text.includes('anthropic') || text.includes('llm') || text.includes('gemini') || text.includes('machine learning')) return 'هوش مصنوعی';
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

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|guccounter|fbclid|gclid|mc_cid|mc_eid)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function uniqueCandidates(candidates: CandidateNews[]): CandidateNews[] {
  const seen = new Set<string>();
  const unique: CandidateNews[] = [];

  for (const candidate of candidates) {
    const key = normalizeUrl(candidate.original_url || candidate.source_url).toLowerCase();
    const titleKey = candidate.title.replace(/\s+/g, ' ').trim().toLowerCase();
    const fingerprint = `${key}::${titleKey}`;
    if (seen.has(fingerprint) || seen.has(key) || seen.has(titleKey)) continue;
    seen.add(fingerprint);
    seen.add(key);
    seen.add(titleKey);
    unique.push(candidate);
  }

  return unique;
}

async function fetchFeedCandidates(feedUrl: string, perFeed: number): Promise<CandidateNews[]> {
  const response = await axios.get(feedUrl, {
    timeout: FEED_TIMEOUT_MS,
    signal: timeoutSignal(FEED_TIMEOUT_MS + 800),
    responseType: 'text',
    maxContentLength: 1024 * 1024,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; EhsanSalehiNewsBot/1.0; +https://ehsansalehi.ir)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
      ],
    },
  });
  const feed: any = await parser.parseString(String(response.data || ''));
  const items = (feed.items || []).slice(0, perFeed);

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
      if (ageHours < 6) score += 85;
      else if (ageHours < 12) score += 70;
      else if (ageHours < 24) score += 55;
      else if (ageHours < 48) score += 35;
      if (/ai|openai|anthropic|gemini|llm|artificial intelligence|security|cyber|bitcoin|crypto|ethereum|blockchain|etf/i.test(`${item.title} ${rawContent} ${feedUrl}`)) score += 35;
      if (rawContent.length > 250) score += 10;

      const mediaContent = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
      const mediaThumbnail = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail[0] : item.mediaThumbnail;
      const image = mediaContent?.$?.url || mediaContent?.url || mediaThumbnail?.$?.url || mediaThumbnail?.url || DEFAULT_IMAGE;
      const sourceUrl = normalizeUrl(String(item.link).trim());

      return {
        title: String(item.title).replace(/\s+/g, ' ').trim(),
        content: String(rawContent).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        image: absolutizeImage(image, sourceUrl),
        source_url: sourceUrl,
        original_url: sourceUrl,
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
      signal: timeoutSignal(EXTRACT_TIMEOUT_MS + 800),
      responseType: 'text',
      maxContentLength: 1200 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EhsanSalehiNewsBot/1.0; +https://ehsansalehi.ir)',
        Accept: 'text/html,application/xhtml+xml',
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const $ = cheerio.load(String(data || ''));
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .newsletter, .related, .paywall, .modal').remove();

    const image = absolutizeImage(
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('article img').first().attr('src') ||
      candidate.image,
      candidate.source_url
    );

    let content = '';
    for (const selector of ['article .entry-content', 'article .post-content', 'article .content', 'main article', '.article-content', '.post-content', '[data-testid="article-body"]', 'article', 'main']) {
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

function fallbackSeedCandidate(index = 0) {
  const item = FALLBACK_NEWS[index % FALLBACK_NEWS.length];
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
    const awaitSocial = searchParams.get('awaitSocial') === 'true';
    const requestedCount = parseBoundedInteger(searchParams.get('count'), 1, 1, MAX_INSERT_PER_RUN);
    const socialLimit = parseBoundedInteger(
      searchParams.get('socialLimit'),
      Math.min(requestedCount, force ? MAX_SOCIAL_PER_RUN : 2),
      0,
      MAX_SOCIAL_PER_RUN
    );
    const feedLimit = Math.min(
      Math.max(Number(searchParams.get('feeds') || (force || requestedCount > 1 ? RSS_FEEDS.length : 8)), 1),
      RSS_FEEDS.length
    );
    const perFeed = parseBoundedInteger(searchParams.get('perFeed'), requestedCount > 1 ? 4 : 2, 1, 8);

    let candidates: CandidateNews[] = [];
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.slice(0, feedLimit).map((feedUrl) => fetchFeedCandidates(feedUrl, perFeed))
    );

    for (const result of feedResults) {
      if (result.status === 'fulfilled') candidates.push(...result.value);
    }

    candidates = uniqueCandidates(candidates).sort((a, b) => b.score - a.score);

    const enrichCount = Math.min(Math.max(requestedCount * 3, 4), 24, candidates.length);
    const enrichedResults = await Promise.allSettled(candidates.slice(0, enrichCount).map((candidate) => extractFullContent(candidate)));
    const enriched = enrichedResults
      .filter((result): result is PromiseFulfilledResult<CandidateNews> => result.status === 'fulfilled')
      .map((result) => result.value);

    const candidatePool = uniqueCandidates([...enriched, ...candidates]).sort((a, b) => b.score - a.score);

    if (candidatePool.length === 0 && seedFallback) {
      for (let i = 0; i < requestedCount; i += 1) candidatePool.push(fallbackSeedCandidate(i));
    }

    if (candidatePool.length === 0) {
      return json({
        success: false,
        code: 'NO_FEED_CANDIDATE',
        message: 'هیچ خبر مناسبی از RSSها در بازه زمانی امن دریافت نشد. در صورت نیاز seedFallback=true را برای تزریق خبر داخلی اضافه کنید.',
        elapsedMs: Date.now() - startedAt,
      }, 200);
    }

    const available = await tableColumns();
    const inserted: InsertedNews[] = [];
    const skippedDuplicates: string[] = [];
    const failedCandidates: Array<{ title: string; error: string }> = [];

    for (const newsCandidate of candidatePool) {
      if (inserted.length >= requestedCount) break;

      try {
        if (await isDuplicate(available, newsCandidate.title, newsCandidate.original_url)) {
          skippedDuplicates.push(newsCandidate.title);
          continue;
        }

        const category = detectCategory(newsCandidate.title, newsCandidate.content, newsCandidate.feedUrl);
        const translated = await withTimeout(
          analyzeAndTranslateNews(newsCandidate.title, newsCandidate.content || newsCandidate.title, newsCandidate.source_name),
          TRANSLATE_TIMEOUT_MS,
          'TRANSLATE'
        ).catch(() => ({
          title: newsCandidate.title,
          summary: (newsCandidate.content || newsCandidate.title).slice(0, 250),
          content: newsCandidate.content || newsCandidate.title,
        }));

        const newId = await insertNews(available, {
          title: translated.title || newsCandidate.title,
          content: translated.content || newsCandidate.content || newsCandidate.title,
          summary: translated.summary || (newsCandidate.content || newsCandidate.title).slice(0, 250),
          image_url: newsCandidate.image || DEFAULT_IMAGE,
          source_name: newsCandidate.source_name,
          source_url: newsCandidate.source_url,
          original_url: newsCandidate.original_url,
          published_at: newsCandidate.published_at,
          created_at: new Date(),
          updated_at: new Date(),
          is_published: true,
          category,
          view_count: 0,
        });

        inserted.push({
          id: newId,
          title: translated.title || newsCandidate.title,
          summary: translated.summary || (newsCandidate.content || newsCandidate.title).slice(0, 250),
          image: newsCandidate.image || DEFAULT_IMAGE,
          source_name: newsCandidate.source_name,
          category,
          link: newId ? `https://ehsansalehi.ir/news/${newId}` : null,
        });
      } catch (error: any) {
        failedCandidates.push({
          title: newsCandidate.title,
          error: error?.message || String(error),
        });
      }
    }

    let socialResults: unknown = null;
    const socialQueue = postSocial
      ? inserted.filter((item) => item.id && item.link).slice(0, socialLimit)
      : [];

    if (socialQueue.length > 0) {
      const publishOne = (item: InsertedNews) => postNewsToAllChannels(
        Number(item.id),
        item.title,
        item.summary || item.title,
        item.image || DEFAULT_IMAGE,
        item.link || `https://ehsansalehi.ir/news/${item.id}`,
        item.source_name || 'فناوری و رمزارز'
      );

      if (awaitSocial) {
        socialResults = await Promise.allSettled(socialQueue.map(publishOne));
      } else {
        Promise.allSettled(socialQueue.map(publishOne)).catch((error) => console.error('Social post background error:', error));
        socialResults = `started-in-background:${socialQueue.length}`;
      }
    }

    return json({
      success: inserted.length > 0,
      message: inserted.length > 0
        ? `تعداد ${inserted.length} خبر تازه ذخیره شد.`
        : 'خبر تازه‌ای ذخیره نشد؛ احتمالاً همه گزینه‌های مناسب تکراری بودند.',
      requestedCount,
      insertedCount: inserted.length,
      inserted,
      skippedDuplicates: skippedDuplicates.slice(0, 10),
      failedCandidates: failedCandidates.slice(0, 5),
      socialResults,
      elapsedMs: Date.now() - startedAt,
      feedStats: {
        requestedFeeds: feedLimit,
        perFeed,
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
