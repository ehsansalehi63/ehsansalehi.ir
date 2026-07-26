export type FallbackNewsItem = {
  id: number;
  title: string;
  title_en: string;
  summary: string;
  summary_en: string;
  content: string;
  content_en: string;
  image_url: string;
  source_name: string;
  source_url: string;
  original_url: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  category: string;
  is_published: boolean;
  view_count: number;
};

const SITE_URL = 'https://ehsansalehi.ir';

export const FALLBACK_NEWS: FallbackNewsItem[] = [
  {
    id: 990001,
    title: 'بازگشت پایدار بازار رمزارزها با تمرکز سرمایه‌گذاران روی ETFها',
    title_en: 'Crypto Market Stabilizes as Investors Refocus on ETF Flows',
    summary: 'بازار رمزارزها پس از نوسان‌های شدید، دوباره زیر ذره‌بین سرمایه‌گذاران نهادی قرار گرفته است. جریان ورودی ETFها، مدیریت ریسک و رفتار بیت‌کوین در محدوده‌های کلیدی، محور اصلی تصمیم‌گیری معامله‌گران شده است.',
    summary_en: 'Crypto markets are stabilizing after heavy volatility, with institutional ETF flows, risk management, and Bitcoin key levels becoming the main focus for traders.',
    content: `بازار رمزارزها در روزهای اخیر نشان داده است که مرحله جدیدی از بلوغ را تجربه می‌کند؛ مرحله‌ای که در آن فقط هیجان معامله‌گران خرد تعیین‌کننده نیست و جریان سرمایه نهادی، صندوق‌های قابل معامله و سیاست‌های پولی نقش پررنگ‌تری دارند.\n\nبرای فعالان بازار، مهم‌ترین نکته این است که بیت‌کوین همچنان شاخص اعتماد کل بازار محسوب می‌شود. حفظ حمایت‌های کلیدی، افزایش حجم معاملات سالم و برگشت تدریجی سرمایه به ETFها می‌تواند نشانه‌ای از کاهش فشار فروش باشد.\n\nاز نگاه فنی، معامله‌گران حرفه‌ای بهتر است به جای دنبال کردن شایعات لحظه‌ای، سه شاخص را زیر نظر داشته باشند: جریان ورودی و خروجی ETFها، سطح نقدینگی در صرافی‌های بزرگ، و واکنش قیمت به محدوده‌های حمایتی چند هفته اخیر.\n\nجمع‌بندی تحلیلی احسان صالحی: رمزارز همچنان یک دارایی پرریسک است، اما برای سازمان‌ها و سرمایه‌گذاران حرفه‌ای، دیگر نمی‌توان آن را صرفاً یک بازار حاشیه‌ای دانست. مدیریت ریسک، تنوع دارایی و نگاه بلندمدت، سه اصل حیاتی در این فضا هستند.`,
    content_en: `Crypto markets are entering a more mature phase where retail excitement is no longer the only driver. Institutional flows, exchange-traded funds, liquidity conditions, and monetary-policy expectations now play a much larger role.\n\nBitcoin remains the core confidence index for the broader market. Holding key support zones, improving volume quality, and renewed ETF demand may indicate that selling pressure is easing.\n\nProfessional traders should monitor three signals instead of reacting to short-term rumors: ETF inflows and outflows, liquidity across major exchanges, and price reactions around recent multi-week support levels.\n\nEhsan Salehi's analysis: crypto remains a high-risk asset class, but it can no longer be treated as a fringe market. Risk control, diversification, and long-term positioning are essential.`,
    image_url: '/images/smart-cover.png',
    source_name: 'تحلیل اختصاصی احسان صالحی',
    source_url: `${SITE_URL}/news/990001`,
    original_url: `${SITE_URL}/news/990001`,
    published_at: '2026-07-26T08:30:00.000Z',
    created_at: '2026-07-26T08:30:00.000Z',
    updated_at: '2026-07-26T08:30:00.000Z',
    category: 'رمزارز و بلاکچین',
    is_published: true,
    view_count: 0,
  },
  {
    id: 990002,
    title: 'هوش مصنوعی سازمانی از مرحله آزمایش به زیرساخت عملیاتی رسید',
    title_en: 'Enterprise AI Moves from Pilot Projects to Operational Infrastructure',
    summary: 'شرکت‌ها دیگر هوش مصنوعی را فقط برای دمو و آزمایش نمی‌خواهند؛ تمرکز جدید روی یکپارچه‌سازی امن AI با داده‌های داخلی، فرایندهای فروش، پشتیبانی و تحلیل مدیریتی است.',
    summary_en: 'Companies are moving AI beyond demos and pilots, focusing on secure integration with internal data, sales operations, support, and executive analytics.',
    content: `موج جدید پیاده‌سازی هوش مصنوعی در سازمان‌ها با موج اولیه تفاوت جدی دارد. در مرحله اول، بسیاری از شرکت‌ها فقط چت‌بات یا ابزار تولید محتوا را امتحان کردند؛ اما اکنون بحث اصلی، تبدیل AI به بخشی از زیرساخت عملیاتی سازمان است.\n\nدر این مدل، هوش مصنوعی باید به CRM، پایگاه دانش، سیستم تیکتینگ، داشبوردهای مدیریتی و حتی فرایندهای امنیتی متصل شود. بدون معماری درست، این اتصال می‌تواند ریسک نشت داده یا تصمیم‌گیری اشتباه ایجاد کند.\n\nسه اصل کلیدی برای پیاده‌سازی موفق AI سازمانی عبارت است از: تفکیک سطح دسترسی داده‌ها، ثبت کامل لاگ تصمیم‌های مدل، و ارزیابی کیفیت پاسخ‌ها با سناریوهای واقعی کسب‌وکار.\n\nجمع‌بندی تحلیلی احسان صالحی: سازمانی در AI موفق می‌شود که قبل از خرید ابزار، معماری داده و امنیت خود را اصلاح کند. هوش مصنوعی خوب، روی زیرساخت بی‌نظم نتیجه پایدار نمی‌دهد.`,
    content_en: `The new wave of enterprise AI adoption is different from the first one. Early projects were mostly chatbots and content-generation demos; now the focus is turning AI into a real operational layer.\n\nIn this model, AI must connect to CRM systems, knowledge bases, ticketing platforms, executive dashboards, and even security workflows. Without proper architecture, this integration can create data leakage and poor decision-making risks.\n\nThree principles matter most: strict data-access separation, complete model-decision logging, and response-quality evaluation using real business scenarios.\n\nEhsan Salehi's analysis: organizations succeed with AI when they fix data architecture and security before buying tools. Powerful AI cannot deliver stable results on disorganized infrastructure.`,
    image_url: '/images/linkedin-cover.png',
    source_name: 'تحلیل اختصاصی احسان صالحی',
    source_url: `${SITE_URL}/news/990002`,
    original_url: `${SITE_URL}/news/990002`,
    published_at: '2026-07-26T07:45:00.000Z',
    created_at: '2026-07-26T07:45:00.000Z',
    updated_at: '2026-07-26T07:45:00.000Z',
    category: 'هوش مصنوعی',
    is_published: true,
    view_count: 0,
  },
  {
    id: 990003,
    title: 'تهدیدهای سایبری مبتنی بر AI سرعت عملیات مهاجمان را چند برابر کرد',
    title_en: 'AI-Assisted Cyber Threats Accelerate Attacker Operations',
    summary: 'استفاده مهاجمان از مدل‌های هوش مصنوعی، شناسایی هدف، تولید ابزار و تحلیل داده‌های سرقت‌شده را سریع‌تر کرده است. دفاع مؤثر دیگر فقط به فایروال محدود نیست و نیازمند مانیتورینگ پیوسته است.',
    summary_en: 'Attackers are using AI to speed up reconnaissance, tooling, and stolen-data analysis. Effective defense now requires continuous monitoring beyond traditional firewalls.',
    content: `هوش مصنوعی برای تیم‌های امنیتی یک ابزار قدرتمند است، اما برای مهاجمان نیز همین‌طور. مهم‌ترین تغییر این نیست که AI تکنیک کاملاً جدیدی ساخته؛ بلکه سرعت اجرای تکنیک‌های شناخته‌شده را بسیار بالا برده است.\n\nدر سناریوهای جدید، مهاجم می‌تواند با کمک AI اطلاعات عمومی سازمان را جمع‌آوری، الگوهای ایمیل فیشینگ را شخصی‌سازی، اسکریپت‌های اولیه را تولید و خروجی اسکن‌ها را سریع‌تر تحلیل کند. این یعنی پنجره زمانی دفاع برای تیم امنیت کوچک‌تر می‌شود.\n\nبرای مقابله، سازمان‌ها باید سه لایه را جدی‌تر بگیرند: سخت‌سازی هویت و MFA، لاگ‌برداری و تشخیص رفتار غیرعادی، و تمرین پاسخ‌گویی به حادثه. امنیت فقط خرید ابزار نیست؛ فرایند و آمادگی تیمی هم تعیین‌کننده است.\n\nجمع‌بندی تحلیلی احسان صالحی: دفاع مدرن باید فرض کند مهاجم سریع، خودکار و داده‌محور عمل می‌کند. بنابراین SOC، مانیتورینگ شبکه و کنترل دسترسی باید همیشه فعال و قابل ممیزی باشند.`,
    content_en: `AI is a powerful tool for defenders, but attackers benefit from it as well. The biggest shift is not that AI has invented entirely new attack methods; it has dramatically accelerated known techniques.\n\nAttackers can use AI to collect public information, personalize phishing emails, generate initial scripts, and analyze scan results faster. This reduces the defensive response window.\n\nOrganizations should strengthen three layers: identity hardening and MFA, behavioral logging and anomaly detection, and incident-response drills. Security is not only a tool purchase; process readiness matters.\n\nEhsan Salehi's analysis: modern defense must assume attackers are fast, automated, and data-driven. SOC workflows, network monitoring, and access control must be always on and auditable.`,
    image_url: '/images/projects/network.jpg',
    source_name: 'تحلیل اختصاصی احسان صالحی',
    source_url: `${SITE_URL}/news/990003`,
    original_url: `${SITE_URL}/news/990003`,
    published_at: '2026-07-25T18:15:00.000Z',
    created_at: '2026-07-25T18:15:00.000Z',
    updated_at: '2026-07-25T18:15:00.000Z',
    category: 'امنیت سایبری',
    is_published: true,
    view_count: 0,
  },
  {
    id: 990004,
    title: 'مدیریت زیرساخت IT در ۲۰۲۶؛ ترکیب مانیتورینگ، اتوماسیون و امنیت',
    title_en: 'IT Infrastructure in 2026 Combines Monitoring, Automation, and Security',
    summary: 'زیرساخت مدرن دیگر فقط سرور و شبکه نیست. سازمان‌ها برای کاهش قطعی، افزایش امنیت و کنترل هزینه باید مانیتورینگ، اتوماسیون و سیاست‌های امنیتی را در یک معماری واحد ببینند.',
    summary_en: 'Modern infrastructure is no longer just servers and networks. Organizations need a unified architecture combining monitoring, automation, and security policy.',
    content: `زیرساخت فناوری اطلاعات در سال‌های اخیر از مدل سنتی فاصله گرفته است. امروز یک شبکه پایدار باید هم‌زمان قابل مشاهده، قابل خودکارسازی و قابل دفاع باشد. اگر هر کدام از این سه بخش جداگانه طراحی شود، هزینه نگهداری بالا می‌رود و ریسک قطعی بیشتر می‌شود.\n\nمانیتورینگ باید فقط وضعیت Up یا Down را نشان ندهد؛ بلکه ظرفیت، خطاهای تکرارشونده، کیفیت سرویس، مصرف منابع و نشانه‌های امنیتی را تحلیل کند. اتوماسیون نیز باید از کارهای تکراری مثل بکاپ، گزارش‌گیری و اصلاح تنظیمات شروع شود.\n\nدر کنار این موارد، معماری امنیت باید از ابتدا در طراحی لحاظ شود: تفکیک VLAN، سیاست دسترسی، مدیریت وصله‌ها، بکاپ آفلاین و کنترل لاگ‌ها.\n\nجمع‌بندی تحلیلی احسان صالحی: زیرساخت موفق، زیرساختی است که قبل از بحران هشدار می‌دهد، هنگام بحران قابل کنترل است و بعد از بحران گزارش دقیق ارائه می‌کند.`,
    content_en: `IT infrastructure has moved beyond the traditional server-and-network model. A stable modern environment must be observable, automatable, and defensible at the same time. If these layers are designed separately, maintenance cost and outage risk increase.\n\nMonitoring should go beyond simple up/down checks. It must analyze capacity, recurring errors, service quality, resource usage, and security signals. Automation should begin with repetitive tasks such as backups, reporting, and configuration correction.\n\nSecurity architecture must be built in from the start: VLAN separation, access policies, patch management, offline backups, and log control.\n\nEhsan Salehi's analysis: successful infrastructure warns before a crisis, remains controllable during a crisis, and produces reliable reports after it.`,
    image_url: '/images/projects/qnap.jpg',
    source_name: 'تحلیل اختصاصی احسان صالحی',
    source_url: `${SITE_URL}/news/990004`,
    original_url: `${SITE_URL}/news/990004`,
    published_at: '2026-07-25T15:20:00.000Z',
    created_at: '2026-07-25T15:20:00.000Z',
    updated_at: '2026-07-25T15:20:00.000Z',
    category: 'فناوری و رمزارز',
    is_published: true,
    view_count: 0,
  },
  {
    id: 990005,
    title: 'لپ‌تاپ‌های هوش مصنوعی و ورک‌استیشن‌های سبک وارد فاز رقابت جدی شدند',
    title_en: 'AI Laptops and Lightweight Workstations Enter a New Competitive Phase',
    summary: 'ورود پردازنده‌های دارای NPU و بهبود مصرف انرژی باعث شده لپ‌تاپ‌های جدید برای توسعه نرم‌افزار، تحلیل داده و اجرای مدل‌های سبک AI گزینه جدی‌تری شوند.',
    summary_en: 'New processors with NPUs and better power efficiency are making modern laptops more practical for software development, data analysis, and lightweight AI workloads.',
    content: `بازار سخت‌افزار در حال حرکت به سمت دستگاه‌هایی است که پردازش هوش مصنوعی را فقط به کارت گرافیک‌های سنگین محدود نمی‌کنند. وجود NPU در نسل جدید پردازنده‌ها باعث شده بخشی از پردازش‌های AI با مصرف انرژی کمتر و تأخیر پایین‌تر انجام شود.\n\nبرای برنامه‌نویسان، تحلیل‌گران داده و مدیران IT، انتخاب لپ‌تاپ دیگر فقط به CPU و RAM محدود نیست. کیفیت نمایشگر، سرعت SSD، ظرفیت RAM، سیستم خنک‌کننده، پشتیبانی لینوکس و قابلیت اجرای ابزارهای مجازی‌سازی هم اهمیت زیادی دارد.\n\nدر خرید دستگاه، باید نوع کاربری مشخص شود: توسعه وب، ماشین مجازی، طراحی شبکه، پردازش AI یا ترید. هر کدام ترکیب سخت‌افزاری متفاوتی می‌خواهد.\n\nجمع‌بندی تحلیلی احسان صالحی: بهترین لپ‌تاپ، گران‌ترین مدل نیست؛ مدلی است که با نیاز واقعی، بودجه و مسیر رشد کاری شما هماهنگ باشد.`,
    content_en: `The hardware market is moving toward devices that do not limit AI processing to heavy GPUs. NPUs in new processors allow some AI workloads to run with lower power consumption and reduced latency.\n\nFor developers, data analysts, and IT managers, laptop selection is no longer only about CPU and RAM. Display quality, SSD speed, RAM capacity, cooling, Linux support, and virtualization support matter as well.\n\nThe use case should be clear before purchasing: web development, virtual machines, network design, AI processing, or trading. Each requires a different hardware balance.\n\nEhsan Salehi's analysis: the best laptop is not necessarily the most expensive one; it is the one aligned with your real workload, budget, and growth path.`,
    image_url: '/images/laptops/omnibook.jpg',
    source_name: 'تحلیل اختصاصی احسان صالحی',
    source_url: `${SITE_URL}/news/990005`,
    original_url: `${SITE_URL}/news/990005`,
    published_at: '2026-07-24T20:40:00.000Z',
    created_at: '2026-07-24T20:40:00.000Z',
    updated_at: '2026-07-24T20:40:00.000Z',
    category: 'سخت‌افزار و گجت',
    is_published: true,
    view_count: 0,
  },
  {
    id: 990006,
    title: 'اتوماسیون انتشار محتوا؛ مسیر سریع‌تر برای رشد ارگانیک سایت‌های تخصصی',
    title_en: 'Content Automation Accelerates Organic Growth for Specialized Websites',
    summary: 'ترکیب تولید خبر، خلاصه‌سازی، لینک‌سازی داخلی و انتشار در شبکه‌های اجتماعی می‌تواند رشد ارگانیک سایت‌های تخصصی را سریع‌تر کند؛ به شرطی که کیفیت و اعتبار محتوا قربانی سرعت نشود.',
    summary_en: 'Combining news publishing, summarization, internal linking, and social distribution can accelerate organic growth, provided quality and credibility are not sacrificed.',
    content: `در سایت‌های تخصصی، سرعت انتشار مهم است اما کافی نیست. اگر خبرها بدون تحلیل، ساختار سئو و لینک‌سازی داخلی منتشر شوند، اثر بلندمدت کمی خواهند داشت. اتوماسیون موفق باید از جمع‌آوری خبر تا انتشار اجتماعی، یک زنجیره قابل کنترل بسازد.\n\nاین زنجیره شامل انتخاب منبع معتبر، خلاصه‌سازی، تولید عنوان سئویی، دسته‌بندی، ساخت لینک داخلی، ثبت در sitemap و بازنشر در شبکه‌های اجتماعی است. هر مرحله باید لاگ داشته باشد تا در صورت خطا قابل بررسی باشد.\n\nبرای برندهای شخصی و سایت‌های IT، ترکیب تحلیل انسانی با کمک AI بهترین نتیجه را می‌دهد؛ چون هم سرعت بالا می‌رود و هم اعتبار حفظ می‌شود.\n\nجمع‌بندی تحلیلی احسان صالحی: اتوماسیون محتوا وقتی ارزشمند است که به کیفیت کمک کند، نه اینکه صرفاً تعداد صفحات را زیاد کند.`,
    content_en: `For specialized websites, publishing speed matters but is not enough. If news is published without analysis, SEO structure, and internal linking, the long-term impact is limited. Successful automation must create a controllable chain from news collection to social distribution.\n\nThis chain includes trusted-source selection, summarization, SEO headline generation, categorization, internal linking, sitemap updates, and social reposting. Each step should be logged for troubleshooting.\n\nFor personal brands and IT websites, combining human analysis with AI assistance delivers the best results because it improves speed while preserving credibility.\n\nEhsan Salehi's analysis: content automation is valuable when it improves quality, not when it merely increases page count.`,
    image_url: '/images/logo-transparent.png',
    source_name: 'تحلیل اختصاصی احسان صالحی',
    source_url: `${SITE_URL}/news/990006`,
    original_url: `${SITE_URL}/news/990006`,
    published_at: '2026-07-24T12:10:00.000Z',
    created_at: '2026-07-24T12:10:00.000Z',
    updated_at: '2026-07-24T12:10:00.000Z',
    category: 'فناوری و رمزارز',
    is_published: true,
    view_count: 0,
  },
];

export function stripFallbackContent(item: FallbackNewsItem, includeContent: boolean) {
  const base = {
    id: item.id,
    title: item.title,
    title_en: item.title_en,
    summary: item.summary,
    summary_en: item.summary_en,
    image_url: item.image_url,
    source_name: item.source_name,
    source_url: item.source_url,
    original_url: item.original_url,
    published_at: item.published_at,
    created_at: item.created_at,
    updated_at: item.updated_at,
    category: item.category,
    is_published: item.is_published,
    view_count: item.view_count,
  };

  return includeContent
    ? { ...base, content: item.content, content_en: item.content_en }
    : base;
}

export function getFallbackNews(options: {
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  includeContent?: boolean;
} = {}) {
  const limit = Math.min(Math.max(Number(options.limit || 6), 1), 100);
  const search = (options.search || '').trim().toLowerCase();
  const category = (options.category || '').trim();
  const includeContent = Boolean(options.includeContent);

  let items = [...FALLBACK_NEWS];

  if (category && category !== 'All' && category !== 'همه') {
    items = items.filter((item) => item.category === category);
  }

  if (search) {
    items = items.filter((item) => {
      const text = [
        item.title,
        item.title_en,
        item.summary,
        item.summary_en,
        item.content,
        item.content_en,
        item.category,
        item.source_name,
      ].join(' ').toLowerCase();
      return text.includes(search);
    });
  }

  if (options.sort === 'trending') {
    items.sort((a, b) => b.view_count - a.view_count || b.id - a.id);
  } else {
    items.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime() || b.id - a.id);
  }

  return items.slice(0, limit).map((item) => stripFallbackContent(item, includeContent));
}

export function getFallbackNewsById(id: string | number) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;
  return FALLBACK_NEWS.find((item) => item.id === numericId) || null;
}

export function isDatabaseAuthError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_ACCESS_DENIED_ERROR'
  );
}
