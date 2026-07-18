'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '../components/I18nProvider';
import { Megaphone, TrendingUp, ShieldCheck, CheckCircle2, ArrowRight, Sparkles, Globe, BarChart3, Award, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Package {
  id: string;
  title: string;
  title_en: string;
  price: string;
  price_en: string;
  features: string[];
  badge: string;
}

export default function AdvertiseContent() {
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const [packages, setPackages] = useState<Package[]>([]);
  const [stats, setStats] = useState<any>({ totalVisits: 1240, totalNews: 115, daScore: '58+ (High Trust Index)', indexingSpeed: 'کمتر از ۶ ساعت در گوگل' });
  const [loading, setLoading] = useState(true);

  // فرم ثبت درخواست
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [packageId, setPackageId] = useState('standard_pr');
  const [targetUrl, setTargetUrl] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/advertise')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (d.packages) setPackages(d.packages);
          if (d.stats) setStats(d.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !phone) {
      toast.error(isEn ? 'Please provide your contact name and phone number.' : 'لطفاً نام مسئول ارتباط و شماره تماس را وارد کنید.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/advertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, contactName, phone, email, packageId, targetUrl, message }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setCompanyName('');
        setContactName('');
        setPhone('');
        setEmail('');
        setTargetUrl('');
        setMessage('');
      } else {
        toast.error(data.error || 'خطا در ثبت درخواست');
      }
    } catch {
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="space-y-16">
      {/* Header Banner */}
      <div className="text-center space-y-6 pt-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/40 text-blue-300 text-xs font-black">
          <Megaphone size={16} className="text-blue-400" />
          {isEn ? 'Direct Access to Iran IT Leaders & Crypto Investors' : 'دسترسی مستقیم به مدیران IT، معماران شبکه و فعالان بازار رمزارز'}
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-400 via-emerald-300 to-amber-300 bg-clip-text text-transparent leading-tight">
          {isEn ? 'Sponsored PR & Advertising Rates' : 'تعرفه رپورتاژ آگهی، بک‌لینک و تبلیغات بنری'}
        </h1>
        <p className="text-zinc-300 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
          {isEn
            ? 'Boost your brand authority and SEO ranking with permanent DoFollow PR posts on Ehsan Salehi’s bilingual IT & Crypto News Portal, supercharged by live LinkedIn and Telegram syndication.'
            : 'با انتشار رپورتاژ آگهی دائمی با لینک‌های فالو (DoFollow) در پایگاه خبری مهندس احسان صالحی (با ۲۰ سال سابقه و اعتبار بالا در موتورهای جستجو)، علاوه بر افزایش چشمگیر اعتبار سئو دامنه خود، مستقیماً به هزاران مدیر عامل، توسعه‌دهنده و سرمایه‌گذار کریپتو معرفی شوید.'}
        </p>

        {/* Live Site Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="glass p-5 rounded-2xl border border-white/10 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-medium">{isEn ? 'Domain Trust Index' : 'اعتبار دامنه و اعتماد گوگل'}</span>
            <p className="text-xl sm:text-2xl font-black text-amber-400">{stats.daScore}</p>
          </div>
          <div className="glass p-5 rounded-2xl border border-white/10 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-medium">{isEn ? 'Google Indexing Speed' : 'سرعت ایندکس در سرچ کنسول'}</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">{stats.indexingSpeed}</p>
          </div>
          <div className="glass p-5 rounded-2xl border border-white/10 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-medium">{isEn ? 'Active News Articles' : 'تعداد مقالات و اخبار فعال'}</span>
            <p className="text-xl sm:text-2xl font-black text-blue-400">{stats.totalNews} مقاله</p>
          </div>
          <div className="glass p-5 rounded-2xl border border-white/10 text-center space-y-1">
            <span className="text-xs text-zinc-400 font-medium">{isEn ? 'Active Social Channels' : 'شبکه‌های بازنشر همزمان'}</span>
            <p className="text-xl sm:text-2xl font-black text-orange-400">۸ پلتفرم فعال</p>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {isEn ? 'Choose Your PR & Sponsorship Package' : 'انتخاب پکیج رپورتاژ و تبلیغات متناسب با هدف شما'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm font-light">
            {isEn ? 'All articles remain permanently archived without any nofollow attributes.' : 'تمامی رپورتاژها دائمی بوده و هرگز حذف یا نوفالو نمی‌شوند.'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900/80 rounded-3xl h-96 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {packages.map((pkg, idx) => {
              const title = isEn ? pkg.title_en : pkg.title;
              const price = isEn ? pkg.price_en : pkg.price;
              const isVIP = pkg.id === 'vip_linkedin_pr';
              return (
                <div
                  key={pkg.id}
                  className={`rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 relative ${
                    isVIP
                      ? 'bg-gradient-to-b from-orange-500/15 via-zinc-900/90 to-blue-500/15 border-2 border-orange-500 shadow-2xl shadow-orange-500/15 scale-105 z-10'
                      : 'bg-zinc-900/80 border-white/10 hover:border-white/30'
                  }`}
                >
                  {isVIP && (
                    <span className="absolute -top-3.5 right-6 bg-orange-500 text-black text-[11px] font-black px-3 py-1 rounded-full shadow-lg">
                      {pkg.badge}
                    </span>
                  )}

                  <div className="space-y-6">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 block mb-1">{!isVIP && pkg.badge}</span>
                      <h3 className="text-xl font-black text-white leading-snug">{title}</h3>
                    </div>

                    <div className="py-4 border-y border-white/10">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">{price}</span>
                      <span className="text-xs text-zinc-400 block mt-1">{isEn ? 'One-time permanent investment' : 'پرداخت یکباره برای انتشار دائمی'}</span>
                    </div>

                    <ul className="space-y-3">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-light leading-relaxed">
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setPackageId(pkg.id);
                      document.getElementById('bookingForm')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full mt-8 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                      isVIP
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black shadow-orange-500/25'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    <span>{isEn ? 'Select & Submit Inquiry' : 'انتخاب این پکیج و ثبت سفارش'}</span>
                    <ArrowRight size={15} className={isEn ? '' : 'rotate-180'} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Form */}
      <div id="bookingForm" className="bg-gradient-to-r from-blue-600/20 via-black to-emerald-600/20 rounded-3xl border-2 border-blue-500/40 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-3">
            <span className="bg-blue-500 text-black text-xs font-black px-3 py-1 rounded-full inline-block shadow-md">
              📝 {isEn ? 'Official PR & Sponsorship Request' : 'فرم ثبت درخواست انتشار رپورتاژ و تبلیغات'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {isEn ? 'Start Your PR Campaign Today' : 'کمپین تبلیغاتی خود را از امروز آغاز کنید'}
            </h3>
            <p className="text-zinc-300 text-xs sm:text-sm font-light">
              {isEn
                ? 'Submit your details below. Our technical content team will reach out via phone or Telegram within 3 hours to review your article or design your banner.'
                : 'جزئیات برند و پکیج انتخابی خود را وارد کنید. تیم پشتیبانی مهندس احسان صالحی حداکثر ظرف ۳ ساعت جهت هماهنگی متن، لینک‌ها و فاکتور با شما تماس می‌گیرد.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Company / Brand Name' : 'نام شرکت یا برند شما'}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={isEn ? 'e.g., Nobitex / Wallex' : 'مثلاً صرافی نوبیتکس / شرکت ابر آروان'}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Contact Person Name *' : 'نام مسئول ارتباط *'}</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={isEn ? 'e.g., Sara Mohammadi' : 'مثلاً مهندس محمدی'}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Phone / Telegram Number *' : 'شماره تماس یا تلگرام *'}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isEn ? '+98 912 xxx xxxx' : '۰۹۱۲۰۰۰۰۰۰۰'}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition font-mono text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Target Package' : 'پکیج انتخابی شما'}</label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="standard_pr">🥈 رپورتاژ آگهی استاندارد (۲,۵۰۰,۰۰۰ تومان)</option>
                  <option value="vip_linkedin_pr">🥇 رپورتاژ ویژه + بازنشر لینکدین (۴,۵۰۰,۰۰۰ تومان)</option>
                  <option value="header_banner">💎 بنر اسپانسرشیپ ۳۰ روزه (۷,۵۰۰,۰۰۰ تومان)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Target Landing Page URL (Optional)' : 'آدرس صفحه فرود یا وبسایت شما (اختیاری)'}</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://yourdomain.ir/promo..."
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition font-mono text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">{isEn ? 'Campaign Details / Special Requirements' : 'توضیحات تکمیلی یا زمان مد نظر جهت انتشار'}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder={isEn ? 'Let us know if your article is ready or if you need our team to write it...' : 'آیا متن رپورتاژ آماده است یا نیاز به نگارش توسط تیم تحریریه مهندس صالحی دارید؟ هر نکته‌ای هست بنویسید...'}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-600 hover:from-blue-600 hover:to-emerald-600 text-black font-black text-sm sm:text-base transition shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <Send size={18} />
              <span>{submitting ? (isEn ? 'Submitting Inquiry...' : 'در حال ثبت درخواست...') : (isEn ? 'Submit PR Request to Technical Team 🚀' : 'ثبت درخواست انتشار رپورتاژ و هماهنگی فوری 🚀')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Back to Home CTA */}
      <div className="text-center pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass text-zinc-300 hover:text-white border border-white/10 hover:border-blue-500/40 text-sm font-bold transition"
        >
          <ArrowRight size={16} className={isEn ? '' : 'rotate-180'} />
          <span>{isEn ? 'Return to Homepage' : 'بازگشت به صفحه اصلی'}</span>
        </Link>
      </div>
    </div>
  );
}
