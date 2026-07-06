'use client';

import { useEffect, useState, useRef } from "react";
import { Toaster, toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import NewsSection from "./components/NewsSection";

export default function Home() {
  const [text, setText] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const fullText = "احسان صالحی رباطی";
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setText(fullText);
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProjects(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setUser(data.user);
          else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
    }
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('.section-hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    toast.loading("در حال ارسال پیام...", { id: "contact" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("پیام شما با موفقیت ارسال شد ✅", { id: "contact" });
        if (formRef.current) formRef.current.reset();
      } else {
        throw new Error(data.error || "خطا در ارسال");
      }
    } catch (error) {
      toast.error("خطا در ارسال پیام. لطفاً بعداً تلاش کنید.", { id: "contact" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('خروج موفق');
  };

  const navItems = [
    { name: "خانه", href: "#" },
    { name: "درباره", href: "#about" },
    { name: "خدمات", href: "#services" },
    { name: "مهارت‌ها", href: "#skills" },
    { name: "پروژه‌ها", href: "#projects" },
    { name: "اخبار", href: "#news" },
    { name: "تماس", href: "#contact" },
  ];

  return (
    <>
      <style>{`
        .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
        .glass-hover:hover { background: rgba(255,255,255,0.1); border-color: rgba(59,130,246,0.3); }
        .btn-neon { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: none; padding: 12px 32px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
        .btn-neon:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(245,158,11,0.4); }
        .btn-outline { background: transparent; border: 2px solid rgba(255,255,255,0.2); color: #fff; padding: 12px 32px; border-radius: 12px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
        .btn-outline:hover { border-color: #f59e0b; background: rgba(245,158,11,0.1); }
        .skill-bar { height: 6px; border-radius: 3px; background: #27272a; overflow: hidden; }
        .skill-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #f59e0b, #3b82f6); transition: width 1.5s ease; width: 0%; }
        .section-hidden { opacity: 0; transform: translateY(50px); transition: all 0.8s ease; }
        .section-visible { opacity: 1; transform: translateY(0); }
        .project-card { transition: all 0.4s ease; cursor: pointer; }
        .project-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 60px rgba(59,130,246,0.2); }
        .project-image { height: 200px; overflow: hidden; background: #1a1a1a; }
        .project-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .project-card:hover .project-image img { transform: scale(1.05); }
        .news-card { transition: all 0.4s ease; cursor: pointer; }
        .news-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 60px rgba(59,130,246,0.2); }
        .news-image { height: 200px; overflow: hidden; background: #1a1a1a; }
        .news-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .news-card:hover .news-image img { transform: scale(1.05); }
        .news-source { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; color: #f59e0b; }
        .news-date { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; color: #9ca3af; }
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient { background-size: 300% 300%; animation: gradientFlow 8s ease infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      <main className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
        <canvas id="particleCanvas" className="fixed inset-0 pointer-events-none z-0" />

        <header className="fixed top-0 left-0 right-0 z-50 glass px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <a href="#" className="text-2xl font-black bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
              احسان صالحی
            </a>
            <nav className="hidden md:flex gap-1 text-zinc-300">
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="nav-link-custom px-4 py-2 text-sm font-medium hover:text-white">
                  {item.name}
                </a>
              ))}
              {user ? (
                <>
                  <a href="/dashboard" className="px-4 py-2 text-sm font-medium text-blue-400">داشبورد</a>
                  <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300">خروج</button>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="px-4 py-2 text-sm font-medium text-blue-400">ورود</a>
                  <a href="/auth/register" className="px-4 py-2 text-sm font-medium bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">ثبت نام</a>
                </>
              )}
            </nav>
            <button className="md:hidden text-white text-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 glass rounded-xl p-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="px-4 py-2 hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  {item.name}
                </a>
              ))}
              {user ? (
                <>
                  <a href="/dashboard" className="px-4 py-2 text-blue-400">داشبورد</a>
                  <button onClick={handleLogout} className="px-4 py-2 text-red-400 text-right">خروج</button>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="px-4 py-2 text-blue-400">ورود</a>
                  <a href="/auth/register" className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg">ثبت نام</a>
                </>
              )}
            </div>
          )}
        </header>

        <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900/40 to-black animate-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%, rgba(245,158,11,0.08), transparent)]" />
          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
            <div className="flex justify-center lg:justify-end order-2 lg:order-1">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-blue-600 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative w-64 h-64 lg:w-[420px] lg:h-[420px] rounded-full overflow-hidden border-4 border-amber-500/40 shadow-2xl">
                  <Image src="/images/profile.jpg" alt="احسان صالحی رباطی" width={420} height={420} className="w-full h-full object-cover hover:scale-110 transition duration-1000" priority />
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right order-1 lg:order-2 animate-fade-up">
              <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 glass rounded-full text-sm tracking-wider">
                <span className="text-amber-400">✦</span>
                <span className="text-amber-300">۱۶ سال تجربه پیشرو در IT</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter bg-gradient-to-r from-white via-amber-200 to-blue-300 bg-clip-text text-transparent">
                {text}
                <span className="inline-block w-1 h-12 bg-amber-400 animate-pulse ml-1"></span>
              </h1>
              <p className="text-2xl lg:text-3xl text-zinc-300 mb-4">معمار شبکه • توسعه‌دهنده فول استک</p>
              <p className="text-xl text-zinc-400 mb-10 max-w-xl">ایجاد زیرساخت‌های امن و مدرن، طراحی وب‌سایت‌های هوشمند و اتوماسیون با هوش مصنوعی</p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a href="#projects" className="btn-neon">مشاهده پروژه‌ها <span>→</span></a>
                <a href="#contact" className="btn-outline">ارتباط با من</a>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-amber-400/60 animate-bounce text-3xl">↓</div>
        </section>

        <section id="about" className="py-24 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">درباره من</h2>
            <p className="text-center text-zinc-400 text-xl mb-16">۱۶ سال کدنویسی، معماری و رهبری تیم‌های فنی</p>
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div className="space-y-6 text-lg leading-relaxed text-zinc-300">
                <p>از سال ۱۳۸۸ تا امروز، در نقش‌های سرپرست IT، مشاور امنیت، توسعه‌دهنده ارشد و معمار شبکه، پروژه‌های کلیدی در سازمان‌های دولتی، هلدینگ‌های خصوصی و شرکت‌های دانش‌بنیان را رهبری کرده‌ام.</p>
                <p>ایده من: تبدیل نیازهای پیچیده کسب‌وکار به راه‌حل‌های ساده، مقیاس‌پذیر و قدرتمند.</p>
              </div>
              <div className="space-y-8">
                {[
                  { icon: '📅', label: '۱۳۸۸ - اکنون', title: 'تجربه ۱۶ ساله IT', desc: 'اداره کار، فرمانداری، هلدینگ‌های بزرگ' },
                  { icon: '💻', label: 'تخصص اصلی', title: 'وردپرس و فول استک', desc: 'Next.js، Tailwind، TypeScript، API' },
                  { icon: '🖥️', label: 'شبکه و سخت‌افزار', title: 'اجرای ۵۰+ پروژه شبکه', desc: 'هولدینگ‌ها، سازمان‌ها، شرکت‌های دانش‌بنیان' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 p-5 glass rounded-2xl border-l-4 border-amber-500 hover:scale-[1.02] transition-all duration-300">
                    <span className="text-3xl">{item.icon}</span>
                    <div>
                      <div className="text-amber-400 text-sm font-bold">{item.label}</div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="text-zinc-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="py-24 px-4 section-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">خدمات من</h2>
            <p className="text-center text-zinc-400 text-xl mb-16">راه‌حل‌های سفارشی برای کسب‌وکار شما</p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: '🌐', title: "طراحی وب‌سایت وردپرسی", desc: "سایت شرکتی، فروشگاهی، خبری با سرعت بالا و سئوی عالی" },
                { icon: '🖥️', title: "شبکه و زیرساخت امن", desc: "طراحی، پیاده‌سازی و پشتیبانی شبکه‌های سازمانی" },
                { icon: '🤖', title: "هوش مصنوعی و اتوماسیون", desc: "ربات‌های چت، سیستم‌های تحلیل داده، اتوماسیون فرآیندها" }
              ].map((s, i) => (
                <div key={i} className="service-card relative p-8 glass rounded-2xl border border-white/10 hover:border-amber-500/50 transition-all duration-300">
                  <div className="text-5xl mb-4">{s.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                  <p className="text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="py-24 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="text-4xl">🏆</span>
              <h2 className="text-5xl font-bold text-center bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">مهارت‌های تخصصی</h2>
            </div>
            <p className="text-center text-zinc-400 text-xl mb-12">تسلط من بر ابزارها و فناوری‌های روز</p>
            <div className="space-y-6">
              {[
                { name: "WordPress & Plugin Dev", level: 95 },
                { name: "Network+ & Routing (Cisco)", level: 92 },
                { name: "ESXI / vCenter / Veeam", level: 88 },
                { name: "Next.js / Tailwind / TS", level: 90 },
                { name: "IT Management & Helpdesk", level: 95 },
                { name: "امنیت و پشتیبانی", level: 89 }
              ].map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300 font-medium">{skill.name}</span>
                    <span className="text-amber-400 font-bold">{skill.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${skill.level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="py-24 px-4 section-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">نمونه‌کارها</h2>
            <p className="text-center text-zinc-400 text-xl mb-16">برخی از پروژه‌های شاخص من</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <p className="text-zinc-500 col-span-full text-center">در حال بارگذاری...</p>
              ) : projects.length === 0 ? (
                <p className="text-zinc-500 col-span-full text-center">هیچ پروژه‌ای یافت نشد</p>
              ) : (
                projects.map((project: any) => (
                  <div key={project.id} className="project-card glass rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40">
                    <div className="project-image">
                      {project.image_url ? (
                        <img src={project.image_url} alt={project.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">💼</div>
                      )}
                    </div>
                    <div className="p-6 text-right">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">{project.title}</h3>
                      <p className="text-zinc-400 text-sm mb-4">{project.desc}</p>
                      <div className="text-xs text-amber-400 font-mono mb-4">{project.tech}</div>
                      <Link href={`/projects/${project.id}`} className="text-white hover:text-amber-400 transition-colors inline-flex items-center gap-2 text-sm">
                        جزئیات پروژه <span>→</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="news" className="py-24 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">📰 آخرین اخبار تکنولوژی</h2>
                <p className="text-zinc-400 text-xl mt-2">جدیدترین رویدادهای دنیای فناوری</p>
              </div>
              <Link href="/news" className="text-amber-400 hover:text-amber-300 transition-colors font-medium inline-flex items-center gap-1 text-lg">
                مشاهده همه اخبار <span>→</span>
              </Link>
            </div>
            <NewsSection />
          </div>
        </section>

        <section id="contact" className="py-24 px-4 glass border-t border-white/5 section-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">تماس با من</h2>
            <p className="text-xl text-zinc-400 mb-12">برای مشاوره، همکاری یا فقط سلام کردن – خوشحال می‌شم بشنوم</p>
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-16 space-y-5 text-right">
              <input type="text" name="name" required className="input-glass w-full px-6 py-4 rounded-xl text-white placeholder:text-zinc-500" placeholder="نام و نام خانوادگی" />
              <input type="email" name="email" required className="input-glass w-full px-6 py-4 rounded-xl text-white placeholder:text-zinc-500" placeholder="آدرس ایمیل" />
              <textarea name="message" required rows={5} className="input-glass w-full px-6 py-4 rounded-xl text-white placeholder:text-zinc-500 resize-none" placeholder="پیام خود را بنویسید..."></textarea>
              <button type="submit" className="btn-neon w-full justify-center text-lg">ارسال پیام <span>📨</span></button>
            </form>
            <div className="grid sm:grid-cols-3 gap-8 mb-12">
              {[
                { icon: '📞', text: '۰۹۱۳۳۲۸۷۹۸۴', sub: '۰۹۱۰۸۳۰۸۷۹۹' },
                { icon: '✉️', text: 'info@ehsansalehi.ir' },
                { icon: '📍', text: 'اصفهان، ایران', sub: 'حضوری و ریموت' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-6 glass rounded-2xl">
                  <span className="text-3xl">{item.icon}</span>
                  <p className="font-medium text-lg">{item.text}</p>
                  {item.sub && <p className="text-zinc-500 text-sm">{item.sub}</p>}
                </div>
              ))}
            </div>
            <a href="https://wa.me/989133287984" target="_blank" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-xl font-bold rounded-2xl transition-all shadow-xl hover:shadow-green-500/30">
              پیام مستقیم در واتساپ
            </a>
          </div>
        </section>

        <footer className="py-12 text-center text-zinc-500 text-sm border-t border-white/5 px-4">
          <p className="mb-2">© ۱۴۰۴ احسان صالحی رباطی – تمامی حقوق محفوظ است</p>
          <p>طراحی و پیاده‌سازی با Next.js، CSS پیشرفته و معماری فول استک</p>
        </footer>

        <Toaster position="top-center" richColors theme="dark" />
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const canvas = document.getElementById('particleCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let particles = [];
            let mouse = { x: null, y: null };
            let w, h;

            function resize() {
              w = canvas.width = window.innerWidth;
              h = canvas.height = window.innerHeight;
            }
            window.addEventListener('resize', resize);
            resize();

            class Particle {
              constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.size = Math.random() * 2 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
              }
              update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > w || this.x < 0) this.speedX *= -1;
                if (this.y > h || this.y < 0) this.speedY *= -1;
                if (mouse.x && mouse.y) {
                  const dx = this.x - mouse.x;
                  const dy = this.y - mouse.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < 100) {
                    const angle = Math.atan2(dy, dx);
                    const force = (100 - dist) / 1000;
                    this.speedX += Math.cos(angle) * force;
                    this.speedY += Math.sin(angle) * force;
                  }
                }
              }
              draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
                ctx.fill();
              }
            }

            for (let i = 0; i < 60; i++) {
              particles.push(new Particle());
            }

            function drawLines() {
              for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                  const dx = particles[i].x - particles[j].x;
                  const dy = particles[i].y - particles[j].y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = \`rgba(59, 130, 246, \${0.15 * (1 - dist / 120)})\`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                  }
                }
              }
            }

            function animate() {
              ctx.clearRect(0, 0, w, h);
              particles.forEach(p => { p.update(); p.draw(); });
              drawLines();
              requestAnimationFrame(animate);
            }

            animate();

            window.addEventListener('mousemove', (e) => {
              mouse.x = e.clientX;
              mouse.y = e.clientY;
            });
            window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
          })();
        `
      }} />
    </>
  );
}
