'use client';

import { useEffect, useState, useRef } from "react";
import { Toaster, toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import NewsSection from "./components/NewsSection";

export default function Home() {
  const [displayText, setDisplayText] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // تایپ‌رایتر ساده و کاربردی
  useEffect(() => {
    const phrases = [
      "راه‌حل‌های ساده برای مشکلات پیچیده",
      "بیایید کارها رو درست انجام بدیم",
      "با ۱۶ سال تجربه در خدمت شمایم",
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const type = () => {
      const currentPhrase = phrases[phraseIndex];
      
      if (!isDeleting && charIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, charIndex));
        charIndex++;
        timeoutId = setTimeout(type, 50);
      } else if (!isDeleting && charIndex > currentPhrase.length) {
        isDeleting = true;
        timeoutId = setTimeout(type, 2000);
      } else if (isDeleting && charIndex > 0) {
        setDisplayText(currentPhrase.slice(0, charIndex));
        charIndex--;
        timeoutId = setTimeout(type, 25);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timeoutId = setTimeout(type, 500);
      }
    };

    type();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // دریافت پروژه‌ها
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProjects(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // بررسی لاگین
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

  // IntersectionObserver
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
    { name: "خدمات", href: "#services" },
    { name: "پروژه‌ها", href: "#projects" },
    { name: "درباره", href: "#about" },
    { name: "مهارت‌ها", href: "#skills" },
    { name: "اخبار", href: "#news" },
    { name: "تماس", href: "#contact" },
  ];

  return (
    <>
      <style>{`
        .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
        .btn-primary { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: none; padding: 12px 32px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
        .btn-primary:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(245,158,11,0.4); }
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
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient { background-size: 300% 300%; animation: gradientFlow 8s ease infinite; }
        .nav-link { transition: color 0.3s; position: relative; }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          right: 0;
          width: 0;
          height: 2px;
          background: #f59e0b;
          transition: width 0.3s;
        }
        .nav-link:hover::after { width: 100%; }
      `}</style>

      <main className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
        <canvas id="particleCanvas" className="fixed inset-0 pointer-events-none z-0" />

        {/* HEADER - فشرده‌تر */}
        <header className="fixed top-0 left-0 right-0 z-50 glass px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <a href="#" className="text-lg font-black bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
              احسان صالحی
            </a>
            <nav className="hidden md:flex gap-0.5 text-zinc-300">
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="nav-link px-3 py-1.5 text-sm font-medium hover:text-white">
                  {item.name}
                </a>
              ))}
              {user ? (
                <>
                  <a href="/dashboard" className="px-3 py-1.5 text-sm font-medium text-blue-400">داشبورد</a>
                  <button onClick={handleLogout} className="px-3 py-1.5 text-sm font-medium text-red-400 hover:text-red-300">خروج</button>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="px-3 py-1.5 text-sm font-medium text-blue-400">ورود</a>
                  <a href="/auth/register" className="px-3 py-1.5 text-sm font-medium bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">ثبت نام</a>
                </>
              )}
            </nav>
            <button className="md:hidden text-white text-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 glass rounded-xl p-4 flex flex-col gap-1">
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

        {/* HERO - پیام حل‌کننده مشکل + بدون فضای خالی */}
        <section className="relative min-h-screen flex items-center justify-center pt-14 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900/40 to-black animate-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%, rgba(245,158,11,0.06), transparent)]" />

          <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center w-full">
            <div className="flex justify-center lg:justify-end order-2 lg:order-1">
              <div className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-amber-500 to-blue-600 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition duration-700"></div>
                <div className="relative w-48 h-48 lg:w-72 lg:h-72 rounded-full overflow-hidden border-2 border-amber-500/30 shadow-2xl">
                  <Image src="/images/profile.jpg" alt="احسان صالحی" width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition duration-700" priority />
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 glass rounded-full text-xs tracking-wider">
                <span className="text-amber-400">✦</span>
                <span className="text-amber-300">۱۶ سال تجربه در خدمت شما</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-3 leading-tight">
                <span className="bg-gradient-to-r from-amber-400 to-blue-400 bg-clip-text text-transparent">
                  احسان صالحی
                </span>
                <span className="block text-white/90 text-2xl lg:text-3xl mt-1 font-normal">
                  {displayText || "راه‌حل‌های ساده برای مشکلات پیچیده"}
                </span>
              </h1>
              <p className="text-base lg:text-lg text-zinc-300 mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                از راه‌اندازی شبکه تا طراحی وب‌سایت، بدون دردسر و با کیفیت
              </p>
              <p className="text-sm text-zinc-400 mb-6 max-w-lg mx-auto lg:mx-0">
                اگر به‌دنبال یک متخصص هستید که کار رو درست و به‌موقع تحویل بده، جای درستی آمدید.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a href="#services" className="btn-primary text-sm">چطور می‌تونم کمکت کنم؟</a>
                <a href="#projects" className="btn-outline text-sm">نمونه کارها</a>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-amber-400/50 animate-bounce text-2xl">↓</div>
        </section>

        {/* SERVICES - اولین بخش (حل‌کننده مشکل) */}
        <section id="services" className="py-16 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">چطور می‌تونم به شما کمک کنم؟</h2>
              <p className="text-zinc-400 text-base">راه‌حل‌های ساده و عملی برای نیازهای شما</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '🌐', title: "وب‌سایت و فروشگاه اینترنتی", desc: "سایت حرفه‌ای با وردپرس، بدون نیاز به برنامه‌نویسی" },
                { icon: '🔒', title: "شبکه و امنیت", desc: "راه‌اندازی شبکه سازمانی، فایروال و پشتیبانی" },
                { icon: '🤖', title: "اتوماسیون و هوش مصنوعی", desc: "ربات‌های مکالمه، تحلیل داده و سیستم‌های هوشمند" }
              ].map((s, i) => (
                <div key={i} className="p-6 glass rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all duration-300 text-center">
                  <div className="text-4xl mb-3">{s.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-zinc-400 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" className="py-16 px-4 section-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">نمونه کارها</h2>
                <p className="text-zinc-400 text-sm">چند نمونه از کارهایی که انجام دادم</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <p className="text-zinc-500 col-span-full text-center">در حال بارگذاری...</p>
              ) : projects.length === 0 ? (
                <p className="text-zinc-500 col-span-full text-center">هیچ پروژه‌ای یافت نشد</p>
              ) : (
                projects.slice(0, 3).map((project: any) => (
                  <div key={project.id} className="project-card glass rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40">
                    <div className="project-image">
                      {project.image_url ? (
                        <img src={project.image_url} alt={project.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">💼</div>
                      )}
                    </div>
                    <div className="p-4 text-right">
                      <h3 className="text-lg font-bold mb-1">{project.title}</h3>
                      <p className="text-zinc-400 text-sm mb-3">{project.desc}</p>
                      <Link href={`/projects/${project.id}`} className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 text-sm">
                        جزئیات <span>→</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="py-16 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">درباره من</h2>
            <p className="text-center text-zinc-400 text-sm mb-6">۱۶ سال تجربه، کنار شما</p>
            <div className="space-y-4 text-zinc-300 text-base leading-relaxed">
              <p>من احسان هستم. از سال ۱۳۸۸ در حوزه IT فعالیت می‌کنم و با سازمان‌های دولتی، هلدینگ‌های خصوصی و شرکت‌های دانش‌بنیان همکاری داشته‌ام.</p>
              <p>کار من این است که مشکلات فنی را به‌زبانی ساده حل کنم. نیازی نیست شما متخصص باشید، من هستم که کارها را برایتان ساده می‌کنم.</p>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section id="skills" className="py-16 px-4 section-hidden">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">مهارت‌ها</h2>
            <p className="text-center text-zinc-400 text-sm mb-8">ابزارهایی که باهاشون کار می‌کنم</p>
            <div className="space-y-4">
              {[
                { name: "وردپرس و طراحی سایت", level: 95 },
                { name: "شبکه و امنیت", level: 92 },
                { name: "مجازی‌سازی (ESXI, Vcenter)", level: 88 },
                { name: "Next.js و توسعه وب", level: 90 },
                { name: "مدیریت و پشتیبانی IT", level: 95 },
              ].map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300 text-sm">{skill.name}</span>
                    <span className="text-amber-400 text-sm font-bold">{skill.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${skill.level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NEWS */}
        <section id="news" className="py-16 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">📰 اخبار تکنولوژی</h2>
                <p className="text-zinc-400 text-sm">جدیدترین رویدادهای دنیای فناوری</p>
              </div>
              <Link href="/news" className="text-amber-400 hover:text-amber-300 transition-colors text-sm inline-flex items-center gap-1">
                همه اخبار <span>→</span>
              </Link>
            </div>
            <NewsSection />
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-16 px-4 glass border-t border-white/5 section-hidden">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">تماس با من</h2>
            <p className="text-zinc-400 text-sm mb-8">سوالی دارید؟ خوشحال می‌شم کمک کنم</p>
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 text-right">
              <input type="text" name="name" required className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-amber-500/50 outline-none transition-colors text-sm" placeholder="نام و نام خانوادگی" />
              <input type="email" name="email" required className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-amber-500/50 outline-none transition-colors text-sm" placeholder="آدرس ایمیل" />
              <textarea name="message" required rows={4} className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-amber-500/50 outline-none transition-colors resize-none text-sm" placeholder="پیام خود را بنویسید..."></textarea>
              <button type="submit" className="btn-primary w-full justify-center text-sm">ارسال پیام</button>
            </form>
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {[
                { icon: '📞', text: '۰۹۱۳۳۲۸۷۹۸۴', sub: '۰۹۱۰۸۳۰۸۷۹۹' },
                { icon: '✉️', text: 'info@ehsansalehi.ir' },
                { icon: '📍', text: 'اصفهان، ایران' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-4 glass rounded-2xl">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-medium text-sm">{item.text}</p>
                  {item.sub && <p className="text-zinc-500 text-xs">{item.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="py-8 text-center text-zinc-500 text-xs border-t border-white/5 px-4">
          <p>© ۱۴۰۴ احسان صالحی – تمامی حقوق محفوظ است</p>
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
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
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
                    const force = (100 - dist) / 1500;
                    this.speedX += Math.cos(angle) * force;
                    this.speedY += Math.sin(angle) * force;
                  }
                }
              }
              draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
                ctx.fill();
              }
            }

            for (let i = 0; i < 50; i++) {
              particles.push(new Particle());
            }

            function drawLines() {
              for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                  const dx = particles[i].x - particles[j].x;
                  const dy = particles[i].y - particles[j].y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = \`rgba(59, 130, 246, \${0.08 * (1 - dist / 100)})\`;
                    ctx.lineWidth = 0.3;
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
