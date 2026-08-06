'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '../components/I18nProvider';
import { ShieldCheck, Cpu, CheckCircle2, ArrowLeft, ArrowRight, MessageSquare, Send, Sparkles, Laptop, Award, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string | number;
  title: string;
  title_en?: string;
  specs: string;
  specs_en?: string;
  description?: string;
  slug?: string;
  cpu: string;
  ram: string;
  hard: string;
  gpu: string;
  display: string;
  condition_grade: string;
  price_estimate: string;
  final_price?: string;
  category: string;
  image_url: string;
  badge: string;
}

interface HardwareContentProps {
  initialProducts?: Product[];
}

export default function HardwareContent({ initialProducts = [] }: HardwareContentProps) {
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [filter, setFilter] = useState<string>('all');

  // فرم مشاوره
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [useCase, setUseCase] = useState(isEn ? 'Software Development & Coding' : 'برنامه‌نویسی و توسعه وب');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only fetch if no initial products provided
    if (initialProducts.length === 0) {
      fetch('/api/hardware')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.products) setProducts(d.products);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [initialProducts.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name) {
      toast.error(isEn ? 'Please enter your name and phone number.' : 'لطفاً نام و شماره تماس خود را وارد کنید.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, budget, useCase, notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setName('');
        setPhone('');
        setBudget('');
        setNotes('');
      } else {
        toast.error(data.error || 'خطا در ثبت درخواست');
      }
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="space-y-16">
      {/* Header Banner */}
      <div className="text-center space-y-6 pt-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-orange-300 text-xs font-black">
          <Award size={16} className="text-amber-400" />
          {isEn ? 'Curated & 100% Verified by Senior IT Architect' : 'گلچین‌شده و ۱۰۰٪ تست‌شده توسط معمار شبکه و متخصص IT'}
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-blue-400 bg-clip-text text-transparent leading-tight">
          {isEn ? 'Engineering & Stock Hardware Boutique' : 'فروشگاه تخصصی لپ‌تاپ‌های مهندسی و استوک اروپایی'}
        </h1>
        <p className="text-zinc-300 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
          {isEn
            ? 'Grade A++ European stock laptops, mobile workstations, and Cisco network gear personally benchmarked, stress-tested, and certified by Eng. Ehsan Salehi (20+ Years IT Experience).'
            : 'برخلاف فروشگاه‌های عمومی، در اینجا تنها لپ‌تاپ‌های مهندسی، ورک‌استیشن‌ها و تجهیزات شبکه گلچین‌شده (Grade A++ اروپایی) عرضه می‌شود که شخصِ مهندس احسان صالحی (با ۲۰ سال سابقه IT) سلامت ۱۰۰٪ پردازنده، باتری و برد آن‌ها را با تست استرس ۲۴ ساعته ممیزی و تایید کرده‌اند.'}
        </p>

        {/* 4 Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {[
            { icon: '🛡️', title: isEn ? '24h CPU/GPU Stress Test' : 'تست استرس ۲۴ ساعته CPU/GPU', desc: isEn ? 'Zero overheating or throttling' : 'تضمین سلامت حرارتی و عدم افت فریم' },
            { icon: '🔋', title: isEn ? '100% Battery & Board Audit' : 'ممیزی ۱۰۰٪ سلامت باتری و برد', desc: isEn ? 'Grade A++ European condition' : 'سیکل باتری پایین و قطعات اورجینال' },
            { icon: '⚙️', title: isEn ? 'Free Dev Setup & OS Install' : 'نصب رایگان سیستم‌عامل و ابزارها', desc: isEn ? 'Windows 11 / Ubuntu + IDEs preloaded' : 'کانفیگ اولیه مخصوص برنامه‌نویسان' },
            { icon: '🤝', title: isEn ? '7-Day Engineering Warranty' : '۷ روز مهلت تست و پشتیبانی VIP', desc: isEn ? 'Direct architect consultation' : 'پشتیبانی مستقیم توسط مهندس صالحی' },
          ].map((item, idx) => (
            <div key={idx} className="glass p-5 rounded-2xl border border-white/10 text-center space-y-2 hover:border-orange-500/40 transition">
              <span className="text-3xl block">{item.icon}</span>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs text-zinc-400 font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Products Catalog */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Laptop className="text-orange-400" />
            {isEn ? 'Curated Hardware & Laptops Catalog' : 'کاتالوگ لپ‌تاپ‌های استوک و سخت‌افزارهای گلچین‌شده'}
          </h2>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
            {isEn ? `${products.length} Items Available` : `${products.length} محصول تاییدشده موجود`}
          </span>
        </div>

        {/* Category Filter */}
        {!loading && products.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  filter === cat
                    ? 'bg-orange-500 text-black border-orange-500'
                    : 'bg-zinc-900/60 text-zinc-300 border-white/10 hover:border-orange-500/40'
                }`}
              >
                {cat === 'all' ? (isEn ? 'All Products' : 'همه محصولات') : cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-900/80 rounded-3xl h-96 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((p) => {
              const title = isEn ? (p.title_en || p.title) : p.title;
              const specs = isEn ? (p.specs_en || p.specs) : p.specs;
              const whatsappText = encodeURIComponent(
                `سلام جناب مهندس صالحی، من از سایت ehsansalehi.ir برای خرید یا استعلام قیمت محصول زیر پیام می‌دهم:\n📌 ${p.title}\nلطفاً شرایط و قیمت لحظه‌ای را اعلام بفرمایید.`
              );
              return (
                <div
                  key={p.id}
                  className="bg-zinc-900/90 rounded-3xl border border-white/10 hover:border-orange-500/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 group flex flex-col"
                >
                  {/* Image */}
                  <Link href={p.slug ? `/hardware/${p.slug}` : '#'} className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                      <span className="bg-orange-500/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                        {p.category}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        {p.condition_grade}
                      </span>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-3">
                      <Link href={p.slug ? `/hardware/${p.slug}` : '#'}>
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-orange-400 transition leading-snug line-clamp-2">
                          {title}
                        </h3>
                      </Link>

                      {/* Quick Specs Icons */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-black/40 rounded-lg p-1.5 text-center">
                          <p className="text-[9px] text-zinc-500">{isEn ? 'CPU' : 'پردازنده'}</p>
                          <p className="text-[10px] font-bold text-white truncate">{p.cpu || '-'}</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-1.5 text-center">
                          <p className="text-[9px] text-zinc-500">{isEn ? 'RAM' : 'رم'}</p>
                          <p className="text-[10px] font-bold text-white truncate">{p.ram || '-'}</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-1.5 text-center">
                          <p className="text-[9px] text-zinc-500">{isEn ? 'Storage' : 'حافظه'}</p>
                          <p className="text-[10px] font-bold text-white truncate">{p.hard || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pt-1">
                        <CheckCircle2 size={15} />
                        <span>{p.badge}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium">{isEn ? 'Price:' : 'قیمت:'}</span>
                        <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">{p.final_price || p.price_estimate}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <a
                          href={`https://wa.me/989108308799?text=${whatsappText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-black font-extrabold text-xs transition text-center flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/20"
                        >
                          <MessageSquare size={14} />
                          <span>{isEn ? 'WhatsApp' : 'واتساپ'}</span>
                        </a>
                        <Link
                          href={p.slug ? `/hardware/${p.slug}` : '#'}
                          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs transition text-center flex items-center justify-center gap-1.5 border border-white/10"
                        >
                          <span>{isEn ? 'Details' : 'مشاهده جزئیات'}</span>
                          <ArrowLeft size={14} className={isEn ? '' : 'rotate-180'} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Consultation Request Form */}
      <div className="bg-gradient-to-r from-orange-600/20 via-black to-blue-600/20 rounded-3xl border-2 border-orange-500/40 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-3">
            <span className="bg-orange-500 text-black text-xs font-black px-3 py-1 rounded-full inline-block shadow-md">
              💬 {isEn ? 'Custom IT & Hardware Consultation' : 'مشاوره و ثبت سفارش اختصاصی'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {isEn ? 'Need a Specific Laptop or Network Architecture Gear?' : 'لپ‌تاپ خاص یا تجهیزات شبکه ویژه‌ای مد نظرتان است؟'}
            </h3>
            <p className="text-zinc-300 text-xs sm:text-sm font-light">
              {isEn
                ? 'Fill out your budget and use case below. Eng. Ehsan Salehi will personally recommend the exact European Grade A++ stock option available in our warehouse.'
                : 'بودجه و نوع کاربری خود (برنامه‌نویسی، طراحی شبکه، ترید یا هوش مصنوعی) را در فرم زیر بنویسید. مهندس احسان صالحی بهترین گزینه Grade A++ موجود در انبار را با تضمین قیمت و مهلت تست به شما معرفی می‌کنند.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Full Name *' : 'نام و نام خانوادگی *'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEn ? 'e.g., Ali Rezaei' : 'مثلاً مهندس علی رضایی'}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Phone / WhatsApp Number *' : 'شماره تماس یا واتساپ *'}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isEn ? '+98 912 xxx xxxx' : '۰۹۱۲۰۰۰۰۰۰۰'}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition font-mono text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Estimated Budget' : 'بودجه تقریبی شما'}</label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={isEn ? 'e.g., $1,500 or 80M Tomans' : 'مثلاً ۶۰ تا ۸۰ میلیون تومان'}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Primary Use Case' : 'نوع کاربری اصلی'}</label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                >
                  <option value="برنامه‌نویسی و توسعه وب">برنامه‌نویسی، توسعه وب و فول استک</option>
                  <option value="هوش مصنوعی و یادگیری ماشین (AI / ML)">هوش مصنوعی، یادگیری ماشین و پردازش سنگین</option>
                  <option value="معماری شبکه، سیسکو و مجازی‌سازی">معماری شبکه، سیسکو، GNS3 و مجازی‌سازی</option>
                  <option value="امنیت سایبری و تست نفوذ (Pentest)">امنیت سایبری، کالی لینوکس و تست نفوذ</option>
                  <option value="ترید و تحلیل بازارهای مالی و کریپتو">ترید، تحلیل تکنیکال کریپتو و بازارهای مالی</option>
                  <option value="مدیریت سازمانی و کارهای اداری لوکس">مدیریت سازمانی و استفاده روزمره لوکس</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Additional Notes / Specific Model Preferences' : 'توضیحات تکمیلی یا مدل خاص مد نظر (اختیاری)'}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={isEn ? 'Tell us any specific requirements (e.g., OLED screen, 32GB RAM minimum)...' : 'هر نکته خاصی مثل حداقل ۳۲ گیگ رم، نمایشگر 4K یا نیاز به فاکتور رسمی را اینجا بنویسید...'}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm sm:text-base transition shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              <span>{submitting ? (isEn ? 'Submitting...' : 'در حال ثبت درخواست...') : (isEn ? 'Submit Consultation Request to Eng. Salehi 🚀' : 'ثبت درخواست مشاوره و ارسال به مهندس احسان صالحی 🚀')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Back to Home CTA */}
      <div className="text-center pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass text-zinc-300 hover:text-white border border-white/10 hover:border-orange-500/40 text-sm font-bold transition"
        >
          <ArrowRight size={16} className={isEn ? '' : 'rotate-180'} />
          <span>{isEn ? 'Return to Homepage' : 'بازگشت به صفحه اصلی'}</span>
        </Link>
      </div>
    </div>
  );
}
