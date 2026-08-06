'use client';
import Link from 'next/link';
import { useI18n } from '../../components/I18nProvider';
import { ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, Send, ShieldCheck, Award, Cpu, HardDrive, Monitor, MemoryStick } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  title_en?: string;
  specs: string;
  specs_en?: string;
  description: string;
  description_en?: string;
  slug: string;
  cpu: string;
  ram: string;
  hard: string;
  gpu: string;
  display: string;
  base_price: number;
  final_price: string;
  condition_grade: string;
  price_estimate: string;
  category: string;
  image_url: string;
  badge: string;
}

interface ProductDetailClientProps {
  product: Product | null;
  allProducts: Product[];
}

export default function ProductDetailClient({ product, allProducts }: ProductDetailClientProps) {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  if (!product) {
    return (
      <div className="text-center py-24">
        <h1 className="text-3xl font-black text-white mb-4">{isEn ? 'محصول یافت نشد' : 'Product Not Found'}</h1>
        <p className="text-zinc-400 mb-8">{isEn ? 'The product you are looking for does not exist.' : 'محصول مورد نظر شما وجود ندارد.'}</p>
        <Link href="/hardware" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
          <ArrowRight className="rotate-180" size={18} />
          {isEn ? 'Back to Hardware' : 'بازگشت به سخت‌افزار'}
        </Link>
      </div>
    );
  }

  const title = isEn ? (product.title_en || product.title) : product.title;
  const description = isEn ? (product.description_en || product.description) : product.description;
  const specs = isEn ? (product.specs_en || product.specs) : product.specs;

  // Get related products (same category, excluding current)
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.slug !== product.slug)
    .slice(0, 3);

  const whatsappText = encodeURIComponent(
    `سلام جناب مهندس صالحی، من از سایت ehsansalehi.ir برای خرید یا استعلام قیمت محصول زیر پیام می‌دهم:\n📌 ${product.title}\nلطفاً شرایط و قیمت لحظه‌ای را اعلام بفرمایید.`
  );

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/" className="hover:text-white transition">
          {isEn ? 'Home' : 'خانه'}
        </Link>
        <span>/</span>
        <Link href="/hardware" className="hover:text-white transition">
          {isEn ? 'Hardware' : 'سخت‌افزار'}
        </Link>
        <span>/</span>
        <span className="text-orange-500 truncate max-w-[200px]">{title}</span>
      </nav>

      {/* Product Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
          <img
            src={product.image_url}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <span className="bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              {product.condition_grade}
            </span>
            <span className="bg-orange-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              {product.category}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award size={20} className="text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{product.badge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
              {title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-emerald-400">{product.final_price}</span>
            </div>
          </div>

          {/* Specs Table */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Cpu size={20} className="text-blue-400" />
              {isEn ? 'Technical Specifications' : 'مشخصات فنی'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Cpu size={18} className="text-blue-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">{isEn ? 'CPU' : 'پردازنده'}</p>
                  <p className="text-sm font-bold text-white">{product.cpu}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MemoryStick size={18} className="text-purple-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">{isEn ? 'RAM' : 'رم'}</p>
                  <p className="text-sm font-bold text-white">{product.ram}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HardDrive size={18} className="text-green-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">{isEn ? 'Storage' : 'حافظه'}</p>
                  <p className="text-sm font-bold text-white">{product.hard}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Monitor size={18} className="text-cyan-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">{isEn ? 'Display' : 'نمایشگر'}</p>
                  <p className="text-sm font-bold text-white">{product.display}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <ShieldCheck size={18} className="text-orange-400 mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">{isEn ? 'GPU' : 'گرافیک'}</p>
                  <p className="text-sm font-bold text-white">{product.gpu}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={`https://wa.me/989108308799?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-green-500/20"
            >
              <MessageSquare size={20} />
              {isEn ? 'WhatsApp Order' : 'سفارش در واتساپ'}
            </a>
            <a
              href="https://t.me/ehsansalehi_tech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-500/20"
            >
              <Send size={20} />
              {isEn ? 'Telegram Chat' : 'مشاوره در تلگرام'}
            </a>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800">
            <div className="text-center">
              <ShieldCheck size={24} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">{isEn ? '7-Day Warranty' : '۷ روز گارانتی'}</p>
            </div>
            <div className="text-center">
              <Award size={24} className="text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">{isEn ? 'Grade A++' : 'Grade A++'}</p>
            </div>
            <div className="text-center">
              <CheckCircle2 size={24} className="text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">{isEn ? 'Free OS Setup' : 'نصب رایگان OS'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 space-y-4">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <CheckCircle2 size={24} className="text-orange-400" />
          {isEn ? 'Description & Use Cases' : 'توضیحات و موارد استفاده'}
        </h2>
        <p className="text-zinc-300 leading-8 text-justify">{description}</p>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white">
            {isEn ? 'Related Products' : 'محصولات مرتبط'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((related) => (
              <Link
                key={related.slug}
                href={`/hardware/${related.slug}`}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition group"
              >
                <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                  <img
                    src={related.image_url}
                    alt={related.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm mb-2 line-clamp-2 group-hover:text-orange-400 transition">
                    {related.title}
                  </h3>
                  <p className="text-emerald-400 font-black">{related.final_price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="pt-8 border-t border-zinc-800">
        <Link
          href="/hardware"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
        >
          <ArrowLeft size={18} />
          {isEn ? 'Back to Hardware' : 'بازگشت به سخت‌افزار'}
        </Link>
      </div>
    </div>
  );
}
