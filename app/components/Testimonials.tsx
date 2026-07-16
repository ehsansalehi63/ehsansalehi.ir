'use client';
import { useI18n } from './I18nProvider';

export default function Testimonials() {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const testimonials = isEn ? [
    {
      name: 'Ali Rezaei',
      role: 'CTO, Knowledge-Based Enterprise',
      text: 'Ehsan completely transformed our corporate network infrastructure with outstanding technical expertise and high reliability. Highly recommended.',
      avatar: '👨‍💼',
    },
    {
      name: 'Sara Mohammadi',
      role: 'CEO, Tech Startup',
      text: 'The Next.js web platform and AI workflow automations engineered by Ehsan saved us 40% in operational costs and turnaround time.',
      avatar: '👩‍💼',
    },
    {
      name: 'Mehdi Karimi',
      role: 'IT Director, Holding Corporation',
      text: 'Exceptional 24/7 support and creative architectural solutions. Ehsan has consistently delivered world-class engineering for all our IT needs.',
      avatar: '👨‍💻',
    },
  ] : [
    {
      name: 'علی رضایی',
      role: 'مدیر فنی، شرکت دانش‌بنیان',
      text: 'احسان با دانش فنی بالا و تعهد عالی، شبکه سازمان ما را به‌طور کامل متحول کرد. پیشنهاد می‌کنم.',
      avatar: '👨‍💼',
    },
    {
      name: 'سارا محمدی',
      role: 'مدیرعامل، استارتاپ فناوری',
      text: 'طراحی سایت و اتوماسیون فرآیندها توسط احسان، باعث صرفه‌جویی ۴۰٪ در زمان و هزینه ما شد.',
      avatar: '👩‍💼',
    },
    {
      name: 'مهدی کریمی',
      role: 'مدیر IT، هلدینگ بزرگ',
      text: 'پشتیبانی عالی و راه‌حل‌های خلاقانه. احسان همیشه پاسخگوی نیازهای ما بوده است.',
      avatar: '👨‍💻',
    },
  ];

  return (
    <section className="py-20 px-4 glass border-y border-white/5 section-hidden font-vazir" id="testimonials" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="max-w-6xl mx-auto text-center">
        <span className="text-orange-400 text-sm font-medium tracking-wider">
          {isEn ? 'Client Testimonials' : 'نظرات مشتریان'}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
          {isEn ? 'What Industry Leaders Say' : 'آنها چه می‌گویند؟'}
        </h2>
        <div className={`grid md:grid-cols-3 gap-6 mt-12 ${isEn ? 'text-left' : 'text-right'}`}>
          {testimonials.map((t, i) => (
            <div key={i} className="glass p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-xs text-zinc-400">{t.role}</div>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed font-light">"{t.text}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
