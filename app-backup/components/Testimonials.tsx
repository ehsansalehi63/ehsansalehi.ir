export default function Testimonials() {
  const testimonials = [
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
    <section className="py-20 px-4 glass border-y border-white/5 section-hidden" id="testimonials">
      <div className="max-w-6xl mx-auto text-center">
        <span className="text-orange-400 text-sm font-medium tracking-wider">نظرات مشتریان</span>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">آنها چه می‌گویند؟</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-12 text-right">
          {testimonials.map((t, i) => (
            <div key={i} className="glass p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{t.avatar}</span>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-zinc-400">{t.role}</div>
                </div>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
