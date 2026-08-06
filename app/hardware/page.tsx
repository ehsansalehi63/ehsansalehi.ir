import HardwareContent from './HardwareContent';
import { Metadata } from 'next';
import { SEED_LAPTOPS } from '@/lib/seedData';
import { makeUniqueHardwareSlug } from '@/lib/hardwareSlug';

export const metadata: Metadata = {
  title: 'لپ‌تاپ‌های استوک مهندسی و سخت‌افزار Grade A++ | گلچین‌شده توسط احسان صالحی',
  description: 'فروش و مشاوره خرید تخصصی لپ‌تاپ‌های مهندسی، برنامه‌نویسی و استوک اروپایی (Grade A++) ۱۰۰٪ تست‌شده و تاییدشده توسط مهندس احسان صالحی با ۲۰ سال تجربه.',
  keywords: ['لپ تاپ استوک', 'لپ تاپ مهندسی', 'خرید لپ تاپ استوک', 'ThinkPad', 'MacBook Pro استوک', 'احسان صالحی', 'تجهیزات شبکه سیسکو'],
};

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

export default function HardwarePage() {
  // Build products directly at render time (SSR)
  const slugCounts: Record<string, number> = {};
  
  const products = SEED_LAPTOPS.map((item, index) => {
    const slug = makeUniqueHardwareSlug(item.model, index, slugCounts);

    return {
      id: slug,
      title: item.model,
      title_en: item.model,
      specs: `پردازنده: ${item.cpu} | رم: ${item.ram} | حافظه: ${item.hard} | گرافیک: ${item.gpu} | نمایشگر: ${item.display}`,
      specs_en: `CPU: ${item.cpu} | RAM: ${item.ram} | Storage: ${item.hard} | GPU: ${item.gpu} | Display: ${item.display}`,
      description: '',
      description_en: '',
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

  return (
    <main className="min-h-screen bg-[#05070b] text-white py-24 px-4 font-vazir">
      <div className="max-w-7xl mx-auto">
        <HardwareContent initialProducts={products} />
      </div>
    </main>
  );
}
