import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { SEED_LAPTOPS } from '@/lib/seedData';

export const metadata: Metadata = {
  title: 'جزئیات محصول | فروشگاه لپ‌تاپ استوک احسان صالحی',
  description: 'جزئیات کامل مشخصات فنی و توضیحات محصول استوک',
};

// Same slug generation logic as hardware page
function makeSlugDirect(model: string): string {
  return model
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/-$/, '');
}

function getCategoryDirect(model: string): string {
  const m = model.toUpperCase();
  if (m.includes('PRECISION')) return 'ورک‌استیشن مهندسی';
  if (m.includes('OMEN') || m.includes('VICTUS')) return 'لپ‌تاپ گیمینگ / AI';
  if (m.includes('OMNIBOOK')) return 'لپ‌تاپ AI نسل جدید';
  if (m.includes('ELITEBOOK')) return 'لپ‌تاپ بیزنس پریمیوم';
  if (m.includes('PROBOOK') || m.includes('HP 250') || m.includes('HP LAPTOP')) return 'لپ‌تاپ اداری / مهندسی';
  if (m.includes('ENVY') || m.includes('PAVILION')) return 'لپ‌تاپ خانگی / حرفه‌ای';
  if (m.includes('CHROMEBOOK')) return 'کروم‌بوک آموزشی';
  if (m.includes('THINKPAD') || m.includes('LENOVO')) return 'لپ‌تاپ مهندسی';
  if (m.includes('LATITUDE')) return 'لپ‌تاپ بیزنس';
  if (m.includes('DELL')) return 'لپ‌تاپ مهندسی';
  if (m.includes('SURFACE')) return 'لپ‌تاپ پریمیوم';
  if (m.includes('IMAC') || m.includes('APPLE')) return 'آل‌این‌وان اپل';
  if (m.includes('شبکه') || m.includes('CISCO')) return 'تجهیزات شبکه';
  if (m.includes('قلم') || m.includes('STYLUS')) return 'لوازم جانبی';
  return 'لپ‌تاپ مهندسی';
}

function getBadgeDirect(item: typeof SEED_LAPTOPS[0]): string {
  const m = item.model.toUpperCase();
  const gpu = item.gpu.toUpperCase();
  const cpu = item.cpu.toUpperCase();

  if (gpu.includes('RTX') && gpu.includes('A5500')) return '🏆 قوی‌ترین ورک‌استیشن موجود';
  if (gpu.includes('RTX') && gpu.includes('A5000')) return '🔥 هیولای پردازش GPU';
  if (gpu.includes('RTX') && (gpu.includes('4060') || gpu.includes('5050'))) return '⚡ گیمینگ + AI نسل جدید';
  if (m.includes('PRECISION 7770')) return '💎 ورک‌استیشن سطح سازمانی';
  if (m.includes('PRECISION 7760')) return '🛡️ ورک‌استیشن حرفه‌ای';
  if (m.includes('PRECISION 55') && m.includes('i9')) return '⭐ پیشنهاد مهندس صالحی';
  if (m.includes('PRECISION')) return '🔧 ورک‌استیشن مهندسی';
  if (m.includes('OMNIBOOK')) return '🤖 لپ‌تاپ AI نسل جدید';
  if (m.includes('ELITEBOOK 840 G11')) return '✨ جدیدترین نسل بیزنس';
  if (m.includes('OMEN')) return '🎮 گیمینگ + تولید محتوا';
  if (m.includes('VICTUS')) return '🎯 بهترین ارزش گیمینگ';
  if (m.includes('X1 CARBON')) return '💼 لوکس‌ترین اولترابوک';
  if (cpu.includes('ULTRA') || cpu.includes('SNAPDRAGON')) return '🤖 آماده AI';
  if (m.includes('SURFACE')) return '🎨 طراحی پریمیوم';
  return '✅ تاییدشده توسط مهندس صالحی';
}

function getConditionDirect(model: string): string {
  const m = model.toUpperCase();
  if (m.includes('OPEN BOX')) return 'Grade A++ (اوپن باکس)';
  return 'Grade A++ اروپایی';
}

function formatPriceDirect(basePrice: number): string {
  const finalPrice = Math.round(basePrice * 1.1);
  return `${finalPrice.toLocaleString('fa-IR')} هزار تومان`;
}

// Get description for a product
function getDescriptionForProduct(item: typeof SEED_LAPTOPS[0]): string {
  const m = item.model.toUpperCase();

  if (m.includes('IMAC')) return `آی‌مک ۲۱.۵ اینچ ۲۰۱۹ اپل، یک آل‌این‌وان حرفه‌ای با نمایشگر خیره‌کننده 4K Retina است که برای طراحان گرافیک، تدوین‌گران ویدیو، عکاسان حرفه‌ای و توسعه‌دهندگان macOS ایده‌آل است.`;
  if (m.includes('PRECISION') && m.includes('7770')) return `Dell Precision 7770 قدرتمندترین ورک‌استیشن موبایل Dell است که برای مهندسان ارشد، محققان هوش مصنوعی و متخصصان CAD/CAM پیشرفته طراحی شده.`;
  if (m.includes('PRECISION') && m.includes('7760')) return `Dell Precision 7760 ورک‌استیشن موبایل رده‌بالا برای متخصصان هوش مصنوعی و پردازش‌های سنگین GPU.`;
  if (m.includes('PRECISION')) return `Dell Precision ورک‌استیشن موبایل حرفه‌ای با گرافیک Quadro/RTX برای مهندسان و طراحان سه‌بعدی.`;
  if (m.includes('OMEN')) return `HP Omen Transcend لپ‌تاپ گیمینگ و AI فوق‌العاده قدرتمند با RTX 4060 و نمایشگر 2K 120Hz.`;
  if (m.includes('VICTUS')) return `HP Victus 15 لپ‌تاپ گیمینگ مقرون‌به‌صرفه با RTX 5050 و نمایشگر 144Hz.`;
  if (m.includes('OMNIBOOK')) return `HP OmniBook لپ‌تاپ AI نسل جدید با پردازنده Snapdragon و NPU اختصاصی.`;
  if (m.includes('ELITEBOOK 840 G11')) return `HP EliteBook 840 G11 جدیدترین لپ‌تاپ بیزنس با Intel Core Ultra 7 و قابلیت‌های AI.`;
  if (m.includes('ELITEBOOK')) return `HP EliteBook لپ‌تاپ بیزنس پریمیوم با کیفیت ساخت بالا و امنیت سازمانی.`;
  if (m.includes('ENVY') || m.includes('PAVILION X360')) return `لپ‌تاپ تبدیل‌پذیر لمسی با قابلیت چرخش ۳۶۰ درجه برای استفاده به عنوان تبلت.`;
  if (m.includes('THINKPAD X1 CARBON')) return `ThinkPad X1 Carbon لپ‌تاپ اولترابوک پریمیوم با بدنه فیبر کربن فوق‌العاده سبک.`;
  if (m.includes('THINKPAD')) return `Lenovo ThinkPad لپ‌تاپ بیزنس با کیبورد افسانه‌ای و استحکام بالا.`;
  if (m.includes('SURFACE')) return `Microsoft Surface Laptop لپ‌تاپ پریمیوم با نمایشگر 2K لمسی و طراحی مینیمال.`;
  if (m.includes('LATITUDE')) return `Dell Latitude لپ‌تاپ بیزنس قابل اعتماد با بدنه مقاوم.`;
  if (m.includes('PROBOOK')) return `HP ProBook لپ‌تاپ بیزنس اقتصادی با عملکرد مناسب.`;
  if (m.includes('CHROMEBOOK')) return `HP Chromebook Fortis لپ‌تاپ آموزشی و مقاوم با ChromeOS.`;
  if (m.includes('لوازم') || m.includes('شبکه')) return `لوازم جانبی شبکه مناسب برای راه‌اندازی شبکه‌های کوچک و خانگی.`;
  if (m.includes('قلم') || m.includes('STYLUS')) return `قلم اصلی سازگار با لپ‌تاپ‌های لمسی HP.`;
  return `لپ‌تاپ استوک ${item.model} تست‌شده و تاییدشده توسط مهندس احسان صالحی.`;
}

export function generateStaticParams() {
  const slugCounts: Record<string, number> = {};
  return SEED_LAPTOPS.map((item) => {
    const base = makeSlugDirect(item.model);
    if (!slugCounts[base]) slugCounts[base] = 0;
    slugCounts[base]++;
    const slug = slugCounts[base] === 1 ? base : `${base}-${slugCounts[base]}`;
    return { slug };
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: routeSlug } = await params;

  // Build all products
  const slugCounts: Record<string, number> = {};
  const products = SEED_LAPTOPS.map((item) => {
    const base = makeSlugDirect(item.model);
    if (!slugCounts[base]) slugCounts[base] = 0;
    slugCounts[base]++;
    const slug = slugCounts[base] === 1 ? base : `${base}-${slugCounts[base]}`;
    
    return {
      id: slug,
      title: item.model,
      title_en: item.model,
      specs: `پردازنده: ${item.cpu} | رم: ${item.ram} | حافظه: ${item.hard} | گرافیک: ${item.gpu} | نمایشگر: ${item.display}`,
      specs_en: `CPU: ${item.cpu} | RAM: ${item.ram} | Storage: ${item.hard} | GPU: ${item.gpu} | Display: ${item.display}`,
      description: getDescriptionForProduct(item),
      description_en: `Stock ${item.model} - Tested and verified by Eng. Ehsan Salehi.`,
      slug,
      cpu: item.cpu,
      ram: item.ram,
      hard: item.hard,
      gpu: item.gpu,
      display: item.display,
      base_price: Math.round(item.base_price * 1.1),
      final_price: formatPriceDirect(item.base_price),
      condition_grade: getConditionDirect(item.model),
      price_estimate: formatPriceDirect(item.base_price),
      category: getCategoryDirect(item.model),
      image_url: item.image_url || '/images/laptops/thinkpad_stock.jpg',
      badge: getBadgeDirect(item),
    };
  });

  const product = products.find(p => p.slug === routeSlug) || null;

  return (
    <main className="min-h-screen bg-[#05070b] text-white py-12 px-4 font-vazir">
      <div className="max-w-6xl mx-auto">
        <ProductDetailClient product={product} allProducts={products} />
      </div>
    </main>
  );
}
