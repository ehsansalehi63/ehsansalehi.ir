import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// غیرفعال کردن تولید استاتیک و استفاده از رندر داینامیک
export const dynamic = 'force-dynamic';

// دریافت اطلاعات یک پروژه از دیتابیس
async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', parseInt(id))
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

// دیکشنری توضیحات تکمیلی برای هر پروژه
const projectDetails: Record<number, {
  fullDescription: string;
  challenges: string[];
  solutions: string[];
  result: string;
  myRole: string;
  techStack: string[];
}> = {
  4: {
    fullDescription: "این پروژه شامل طراحی و پیاده‌سازی شبکه کامل برای هلدینگ تجارت بین‌الملل دانا بود. هدف اصلی ایجاد یک زیرساخت شبکه امن، مقیاس‌پذیر و با قابلیت اطمینان بالا برای پشتیبانی از عملیات‌های حیاتی هلدینگ بود. این شبکه شامل ۵ ساختمان مجزا با بیش از ۲۰۰ کاربر فعال و نیاز به اتصال پایدار به مرکز داده اصلی بود.",
    challenges: [
      "یکپارچه‌سازی سیستم‌های قدیمی (Legacy Systems) با تجهیزات جدید شبکه",
      "تامین امنیت در برابر تهدیدات سایبری پیشرفته و حملات DDoS",
      "کاهش زمان خرابی شبکه (Downtime) به کمتر از ۰.۱٪ در حین اجرا",
      "مدیریت پهنای باند برای پشتیبانی از ترافیک سنگین داده و ویدئوکنفرانس"
    ],
    solutions: [
      "طراحی شبکه با معماری سه‌لایه (Core, Distribution, Access) و استفاده از پروتکل‌های冗余 مانند STP و VRRP",
      "پیاده‌سازی فایروال‌های Fortinet (FortiGate 100F) به همراه سیستم‌های تشخیص نفوذ (IDS/IPS)",
      "استفاده از تجهیزات Cisco Catalyst 9300 برای لایه توزیع و Catalyst 9200 برای لایه دسترسی",
      "پیاده‌سازی QoS برای اولویت‌بندی ترافیک حیاتی و مدیریت پهنای باند"
    ],
    result: "شبکه با ۹۹.۹۹٪ پایداری و امنیت بالا در ۶ ماه اول بهره‌برداری، با قابلیت توسعه برای ۵ سال آینده. زمان پاسخگویی شبکه (Latency) به زیر ۵ میلی‌ثانیه کاهش یافت و رضایت کاربران به ۹۸٪ رسید.",
    myRole: "معمار شبکه و سرپرست تیم پیاده‌سازی (۱۳۹۹-۱۴۰۰) - مسئول طراحی کلی، انتخاب تجهیزات، نظارت بر اجرا و آموزش تیم پشتیبانی",
    techStack: ["Cisco Catalyst", "Fortinet FortiGate", "Veeam Backup", "VMware ESXi", "Ubiquiti UniFi", "STP", "VRRP", "QoS"]
  },
  5: {
    fullDescription: "پروژه هیئت حل اختلاف اداره کار اصفهان شامل اجرای شبکه سالن با تمرکز بر پایداری و امنیت بالا برای ارتباطات داخلی و جلسات حساس بود. این سالن به‌عنوان مرکز برگزاری جلسات مهم و مذاکرات حقوقی استفاده می‌شد و نیاز به امنیت و پایداری فوق‌العاده داشت.",
    challenges: [
      "نیاز به امنیت بالا برای ارتباطات داخلی و جلوگیری از شنود",
      "تامین اینترنت پایدار و پرسرعت برای جلسات آنلاین و کنفرانس‌های ویدئویی",
      "محدودیت فیزیکی فضا برای نصب تجهیزات و کابل‌کشی",
      "هماهنگی با ساعت کاری اداره برای جلوگیری از اختلال در فعالیت‌های روزمره"
    ],
    solutions: [
      "پیاده‌سازی VLAN‌های جداگانه برای بخش‌های مختلف (اداری، جلسات، مهمانان)",
      "استفاده از تجهیزات MikroTik (RouterBoard 4011) و Ubiquiti (UniFi Switch PRO) با قابلیت QoS",
      "طراحی شبکه با کابل‌کشی CAT6 و تجهیزات رک‌مانت در فضای محدود",
      "استفاده از UPS های صنعتی برای تامین برق بدون وقفه"
    ],
    result: "شبکه‌ای پایدار با امنیت بالا و پشتیبانی از ۵۰ کاربر همزمان، با کاهش ۸۰٪ مشکلات شبکه قبلی. زمان راه‌اندازی جلسات ویدئویی به کمتر از ۱۰ ثانیه کاهش یافت.",
    myRole: "مشاور و مجری شبکه (۱۳۹۷) - مسئول طراحی فیزیکی و منطقی شبکه، انتخاب تجهیزات، اجرای کابل‌کشی و راه‌اندازی نهایی",
    techStack: ["MikroTik RouterOS", "Ubiquiti UniFi", "CAT6 Cabling", "UPS Systems", "QoS", "VLAN", "VPN"]
  },
  6: {
    fullDescription: "طراحی و راه‌اندازی سایت deltadasht.com به عنوان یک وب‌سایت شرکتی برای نمایش خدمات، پروژه‌ها و معرفی برند شرکت دلتا دشت. این سایت به‌عنوان ویترین دیجیتال شرکت طراحی شده و هدف آن جذب مشتریان جدید و نمایش توانمندی‌های شرکت است.",
    challenges: [
      "طراحی جذاب و مدرن مطابق با هویت برند شرکت (رنگ‌های سازمانی، لوگو و فونت)",
      "بهینه‌سازی برای موتورهای جستجو (SEO) برای کلمات کلیدی مرتبط با صنعت",
      "سرعت بالای لود صفحات (کمتر از ۲ ثانیه) برای تجربه کاربری بهتر",
      "امنیت بالا در برابر حملات و نفوذ به سایت",
      "سازگاری کامل با موبایل و دستگاه‌های مختلف"
    ],
    solutions: [
      "استفاده از قالب Elementor Pro و طراحی اختصاصی با همکاری تیم گرافیک",
      "پیاده‌سازی افزونه‌های SEO مانند Yoast SEO و Rank Math با تنظیمات پیشرفته",
      "بهینه‌سازی تصاویر با EWWW Image Optimizer و استفاده از کش (Cache) با WP Rocket",
      "استفاده از SSL (Let's Encrypt) و افزونه امنیتی Wordfence برای حفاظت کامل",
      "طراحی واکنش‌گرا (Responsive) با استفاده از Breakpoint‌های سفارشی"
    ],
    result: "سایت با سرعت لود عالی (۱.۸ ثانیه) و رتبه‌های برتر گوگل برای کلمات کلیدی اصلی، افزایش ۴۰٪ ترافیک ارگانیک در ۳ ماه، افزایش ۲۵٪ تعداد درخواست‌های مشاوره از طریق فرم تماس",
    myRole: "طراح و توسعه‌دهنده وردپرس (۱۴۰۱) - مسئول پیاده‌سازی کامل سایت، انتخاب افزونه‌ها، بهینه‌سازی سرعت و امنیت، آموزش تیم محتوا",
    techStack: ["WordPress", "Elementor Pro", "PHP 8.1", "MySQL", "WP Rocket", "Yoast SEO", "Wordfence", "Cloudflare CDN"]
  },
  7: {
    fullDescription: "سایت drmoeini.ir یک وب‌سایت شخصی و حرفه‌ای برای دکتر معینی، با هدف نمایش مقالات علمی، سوابق تحصیلی، فعالیت‌های پژوهشی و ارتباط با مخاطبان (دانشجویان، همکاران و علاقه‌مندان) طراحی شده است.",
    challenges: [
      "ساخت یک وب‌سایت ساده ولی حرفه‌ای با تمرکز بر محتوا و خوانایی بالا",
      "ایجاد سیستم جستجوی پیشرفته برای مقالات بر اساس عنوان، تاریخ و دسته‌بندی",
      "امنیت بالا برای جلوگیری از هک و دسترسی غیرمجاز به محتوا",
      "یکپارچه‌سازی با شبکه‌های اجتماعی و سیستم‌های اشتراک‌گذاری",
      "سرعت لود بالا با توجه به تعداد بالای مقالات (بیش از ۲۰۰ مقاله)"
    ],
    solutions: [
      "طراحی با قالب اختصاصی (Custom Theme) ساخته شده با HTML5, CSS3 و PHP",
      "استفاده از افزونه‌های امنیتی مانند Wordfence و تغییر مسیر لاگین برای جلوگیری از حملات Brute Force",
      "بهینه‌سازی سرعت با CDN (Cloudflare) و کش پیشرفته با WP Super Cache",
      "ایجاد سیستم جستجوی پیشرفته با استفاده از افزونه‌های تخصصی جستجو",
      "استفاده از SSL و HTTPS برای امنیت کامل"
    ],
    result: "وب‌سایت با ۲۰۰+ مقاله علمی و بازدید ماهانه ۵۰۰۰+ کاربر، با امنیت بالا و بدون هیچ‌گونه نفوذ یا مشکل امنیتی در طول ۲ سال فعالیت. نرخ پرش (Bounce Rate) کمتر از ۳۵٪",
    myRole: "توسعه‌دهنده وردپرس و مشاور امنیت (۱۴۰۲) - مسئول طراحی قالب، پیاده‌سازی سیستم جستجو، امنیت‌سازی و بهینه‌سازی سرعت",
    techStack: ["WordPress", "Custom Theme", "PHP 8.0", "MySQL", "Cloudflare", "Wordfence", "WP Super Cache", "HTML5", "CSS3", "jQuery"]
  }
};

// صفحه جزئیات پروژه
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  const details = projectDetails[project.id] || {
    fullDescription: project.desc || 'توضیحات کامل این پروژه به زودی اضافه می‌شود.',
    challenges: ['اطلاعات تکمیلی به زودی اضافه می‌شود.'],
    solutions: ['اطلاعات تکمیلی به زودی اضافه می‌شود.'],
    result: 'نتیجه پروژه به زودی اضافه می‌شود.',
    myRole: 'نقش من در این پروژه به زودی اضافه می‌شود.',
    techStack: project.tech ? project.tech.split(',').map(t => t.trim()) : ['اطلاعات تکمیلی به زودی اضافه می‌شود.']
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
      {/* هدر */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            احسان صالحی
          </Link>
          <Link href="/" className="text-zinc-300 hover:text-white transition">
            بازگشت به خانه
          </Link>
        </div>
      </header>

      {/* محتوای اصلی */}
      <main className="pt-24 px-4 max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-white/10">
          {/* عکس پروژه */}
          {project.image_url && (
            <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* عنوان */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            {project.title}
          </h1>

          {/* توضیحات کامل */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-amber-400 mb-3">📋 درباره پروژه</h2>
            <p className="text-zinc-300 leading-relaxed">{details.fullDescription}</p>
          </div>

          {/* چالش‌ها */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ چالش‌ها</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {details.challenges.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* راه‌حل‌ها */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-green-400 mb-2">✅ راه‌حل‌ها</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {details.solutions.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* نتیجه */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-400 mb-2">📈 نتیجه</h3>
            <p className="text-zinc-300">{details.result}</p>
          </div>

          {/* نقش من */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-purple-400 mb-2">👤 نقش من</h3>
            <p className="text-zinc-300">{details.myRole}</p>
          </div>

          {/* تکنولوژی‌ها */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-amber-400 mb-2">🛠️ تکنولوژی‌های استفاده‌شده</h3>
            <div className="flex flex-wrap gap-2">
              {details.techStack.map((tech: string) => (
                <span key={tech} className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300 border border-white/5">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* لینک پروژه */}
          {project.link && project.link !== '#' && (
            <div className="mb-6">
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition"
              >
                مشاهده پروژه <span>→</span>
              </a>
            </div>
          )}

          {/* تاریخ ایجاد */}
          <div className="mt-8 text-sm text-zinc-500 border-t border-white/5 pt-4">
            تاریخ انتشار: {new Date(project.createdAt).toLocaleDateString('fa-IR')}
          </div>

          {/* دکمه بازگشت */}
          <Link
            href="/#projects"
            className="inline-block mt-6 text-zinc-400 hover:text-white transition"
          >
            ← بازگشت به لیست پروژه‌ها
          </Link>
        </div>
      </main>
    </div>
  );
}
