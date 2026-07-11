'use client';

import { useEffect, useState, useRef } from "react";
import { Toaster, toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import NewsSection from "./components/NewsSection";
import BackToTop from "./components/BackToTop";
import Testimonials from "./components/Testimonials";
import Certifications from "./components/Certifications";
import SocialLinks from "./components/SocialLinks";

export default function Home() {
  const [text, setText] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const fullText = "احسان صالحی رباطی";
  const formRef = useRef<HTMLFormElement>(null);

  // تایپ‌رایتر
  useEffect(() => {
    let index = 0;
    let isDeleting = false;
    let currentText = '';
    let timeoutId: NodeJS.Timeout | null = null;
    
    const type = () => {
      if (!isDeleting && index <= fullText.length) {
        currentText = fullText.slice(0, index);
        setText(currentText);
        index++;
        timeoutId = setTimeout(type, 60);
      } else if (!isDeleting && index > fullText.length) {
        isDeleting = true;
        timeoutId = setTimeout(type, 1500);
      } else if (isDeleting && index > 0) {
        currentText = fullText.slice(0, index);
        setText(currentText);
        index--;
        timeoutId = setTimeout(type, 30);
      } else if (isDeleting && index === 0) {
        isDeleting = false;
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
    { name: "پروژه‌ها", href: "/projects" },
    { name: "درباره", href: "#about" },
    { name: "مهارت‌ها", href: "#skills" },
    { name: "نظرات", href: "#testimonials" },
    { name: "اخبار", href: "#news" },
    { name: "تماس", href: "#contact" },
  ];

  return (
    <>
      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .glass-dark {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .btn-primary {
          background: linear-gradient(135deg, #ff6b00, #ff8c00);
          color: #fff;
          border: none;
          padding: 14px 36px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s ease;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(255, 107, 0, 0.2);
        }
        .btn-primary:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 8px 40px rgba(255, 107, 0, 0.35);
        }
        .btn-outline {
          background: transparent;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 14px 36px;
          border-radius: 50px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.4s ease;
          font-size: 0.95rem;
        }
        .btn-outline:hover {
          border-color: #ff6b00;
          background: rgba(255, 107, 0, 0.08);
          transform: translateY(-2px);
        }
        .section-hidden {
          opacity: 0;
          transform: translateY(60px);
          transition: all 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .section-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .project-card {
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: pointer;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(12px);
        }
        .project-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 20px 60px rgba(255, 107, 0, 0.08);
          border-color: rgba(255, 107, 0, 0.2);
        }
        .project-image {
          height: 200px;
          overflow: hidden;
          background: #1a1a2e;
          position: relative;
        }
        .project-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .project-card:hover .project-image img {
          transform: scale(1.05);
        }
        .skill-bar {
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }
        .skill-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #ff6b00, #ff8c00);
          transition: width 1.8s cubic-bezier(0.22, 1, 0.36, 1);
          width: 0%;
        }
        .nav-link {
          transition: color 0.3s ease;
          position: relative;
          font-weight: 400;
          letter-spacing: 0.3px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          right: 0;
          width: 0;
          height: 2px;
          background: #ff6b00;
          transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nav-link:hover::after {
          width: 100%;
        }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 300% 300%;
          animation: gradientFlow 12s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .float-animation {
          animation: float 6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .hero-gradient {
          background: radial-gradient(ellipse at 70% 30%, rgba(255,107,0,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 30% 70%, rgba(59,130,246,0.04) 0%, transparent 50%);
        }
        .service-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          border-radius: 16px;
        }
        .service-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255, 107, 0, 0.2);
          box-shadow: 0 20px 60px rgba(255, 107, 0, 0.05);
        }
        .input-glass {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .input-glass:focus {
          border-color: #ff6b00;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.08);
          outline: none;
        }
      `}</style>

      <main className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
        <canvas id="particleCanvas" className="fixed inset-0 pointer-events-none z-0" />

        {/* ====== HEADER ====== */}
        <header className="fixed top-0 left-0 right-0 z-50 glass px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <a href="#" className="flex items-center gap-2">
              <img 
                src="/images/logo-transparent.png" 
                alt="احسان صالحی" 
                className="h-10 w-auto"
              />
            </a>
            <nav className="hidden md:flex gap-1 text-zinc-300">
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="nav-link px-4 py-2 text-sm font-medium hover:text-white">
                  {item.name}
                </a>
              ))}
              {user ? (
                <>
                  <a href="/dashboard" className="nav-link px-4 py-2 text-sm font-medium text-blue-400">داشبورد</a>
                  <button onClick={handleLogout} className="nav-link px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300">خروج</button>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="nav-link px-4 py-2 text-sm font-medium text-blue-400">ورود</a>
                  <a href="/auth/register" className="px-4 py-2 text-sm font-medium bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors">ثبت نام</a>
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

        {/* ====== HERO ====== */}
        <section className="relative min-h-[90vh] flex items-center justify-center pt-16 px-4 overflow-hidden hero-gradient">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-purple-900/30 to-black animate-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%, rgba(255,107,0,0.04), transparent)]" />

          <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full py-8">
            <div className="flex justify-center lg:justify-end order-2 lg:order-1">
              <div className="relative group">
                <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/20 to-blue-600/20 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition duration-700" />
                <div className="relative w-64 h-64 lg:w-[380px] lg:h-[380px] rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl float-animation">
                  <Image 
                    src="/images/profile.jpg" 
                    alt="احسان صالحی" 
                    width={380} 
                    height={380} 
                    className="w-full h-full object-cover hover:scale-105 transition duration-1000" 
                    priority 
                  />
                  <div className="absolute bottom-4 right-4 glass-dark rounded-full px-4 py-1.5 text-xs border border-orange-500/30">
                    <span className="text-orange-400">✦</span> ۱۶ سال تجربه
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 glass-dark rounded-full text-xs tracking-wider border border-white/5">
                <span className="text-orange-400">✦</span>
                <span className="text-zinc-300">مشاور و مجری پروژه‌های فناوری</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                  احسان صالحی
                </span>
                <span className="block text-white/80 text-xl lg:text-2xl mt-2 font-light">
                  {text || "مشکلات فنی را ساده می‌کنم"}
                </span>
              </h1>
              <p className="text-base lg:text-lg text-zinc-300 mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                از راه‌اندازی شبکه تا طراحی وب‌سایت، بدون دردسر و با کیفیت
              </p>
              <p className="text-sm text-zinc-400 mb-8 max-w-lg mx-auto lg:mx-0 font-light">
                اگر به‌دنبال یک متخصص هستید که کار رو درست و به‌موقع تحویل بده، جای درستی آمدید.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a href="#services" className="btn-primary">چطور می‌تونم کمک کنم؟</a>
                <Link href="/projects" className="btn-outline">نمونه کارها</Link>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-orange-400/30 animate-bounce text-2xl">↓</div>
        </section>

        {/* ====== SERVICES ====== */}
        <section id="services" className="py-20 px-4 section-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-orange-400 text-sm font-medium tracking-wider">خدمات من</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">چطور می‌تونم به شما کمک کنم؟</h2>
              <p className="text-zinc-400 text-sm mt-2 font-light">راه‌حل‌های ساده و عملی برای نیازهای شما</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '🌐', title: "وب‌سایت و فروشگاه", desc: "سایت حرفه‌ای با وردپرس، بدون نیاز به برنامه‌نویسی" },
                { icon: '🔒', title: "شبکه و امنیت", desc: "راه‌اندازی شبکه سازمانی، فایروال و پشتیبانی" },
                { icon: '🤖', title: "اتوماسیون و هوش مصنوعی", desc: "ربات‌های مکالمه، تحلیل داده و سیستم‌های هوشمند" }
              ].map((s, i) => (
                <div key={i} className="service-card p-8 text-center group">
                  <div className="text-5xl mb-4">{s.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-zinc-400 text-sm font-light">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== PROJECTS PREVIEW ====== */}
        <section className="py-20 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-orange-400 text-sm font-medium tracking-wider">نمونه کارها</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">پروژه‌های اخیر</h2>
              </div>
              <Link href="/projects" className="text-orange-400 hover:text-orange-300 transition-colors text-sm inline-flex items-center gap-1 font-medium">
                همه پروژه‌ها <span>→</span>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <p className="text-zinc-500 col-span-full text-center py-12">در حال بارگذاری...</p>
              ) : projects.length === 0 ? (
                <p className="text-zinc-500 col-span-full text-center py-12">هیچ پروژه‌ای یافت نشد</p>
              ) : (
                projects.slice(0, 3).map((project: any) => (
                  <div key={project.id} className="project-card group">
                    <div className="project-image">
                      {project.image_url ? (
                        <img src={project.image_url} alt={project.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">💼</div>
                      )}
                    </div>
                    <div className="p-6 text-right">
                      <h3 className="text-lg font-bold mb-1 group-hover:text-orange-400 transition-colors">{project.title}</h3>
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2 font-light">{project.desc}</p>
                      <Link href={`/projects/${project.id}`} className="text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center gap-1 text-sm font-medium">
                        جزئیات <span>→</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ====== ABOUT ====== */}
        <section id="about" className="py-20 px-4 section-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-orange-400 text-sm font-medium tracking-wider">درباره من</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">چرا من؟</h2>
            <div className="mt-8 space-y-5 text-zinc-300 text-base leading-relaxed font-light">
              <p>من احسان هستم. از سال ۱۳۸۸ در حوزه IT فعالیت می‌کنم و با سازمان‌های دولتی، هلدینگ‌های خصوصی و شرکت‌های دانش‌بنیان همکاری داشته‌ام.</p>
              <p>کار من این است که مشکلات فنی را به‌زبانی ساده حل کنم. نیازی نیست شما متخصص باشید، من هستم که کارها را برایتان ساده می‌کنم.</p>
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="glass p-6 rounded-xl">
                  <div className="text-3xl font-bold text-orange-400">۱۶+</div>
                  <div className="text-xs text-zinc-400 mt-1 font-light">سال تجربه</div>
                </div>
                <div className="glass p-6 rounded-xl">
                  <div className="text-3xl font-bold text-orange-400">۵۰+</div>
                  <div className="text-xs text-zinc-400 mt-1 font-light">پروژه موفق</div>
                </div>
                <div className="glass p-6 rounded-xl">
                  <div className="text-3xl font-bold text-orange-400">۱۰۰٪</div>
                  <div className="text-xs text-zinc-400 mt-1 font-light">رضایت مشتری</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== TESTIMONIALS ====== */}
        <Testimonials />

        {/* ====== CERTIFICATIONS ====== */}
        <Certifications />

        {/* ====== SKILLS ====== */}
        <section id="skills" className="py-20 px-4 glass border-y border-white/5 section-hidden">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-orange-400 text-sm font-medium tracking-wider">مهارت‌ها</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">تخصص‌های فنی</h2>
            </div>
            <div className="space-y-5">
              {[
                { name: "وردپرس و طراحی سایت", level: 95 },
                { name: "شبکه و امنیت", level: 92 },
                { name: "مجازی‌سازی (ESXI, Vcenter)", level: 88 },
                { name: "Next.js و توسعه وب", level: 90 },
                { name: "مدیریت و پشتیبانی IT", level: 95 },
              ].map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-zinc-300 text-sm font-light">{skill.name}</span>
                    <span className="text-orange-400 text-sm font-bold">{skill.level}%</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${skill.level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== NEWS ====== */}
        <section id="news" className="py-20 px-4 section-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-orange-400 text-sm font-medium tracking-wider">اخبار</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">📰 آخرین اخبار تکنولوژی</h2>
              </div>
              <Link href="/news" className="text-orange-400 hover:text-orange-300 transition-colors text-sm inline-flex items-center gap-1 font-medium">
                همه اخبار <span>→</span>
              </Link>
            </div>
            <NewsSection />
          </div>
        </section>

        {/* ====== CONTACT ====== */}
        <section id="contact" className="py-20 px-4 glass border-t border-white/5 section-hidden">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-orange-400 text-sm font-medium tracking-wider">تماس با من</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">بیایید با هم کار کنیم</h2>
            <p className="text-zinc-400 text-sm mt-2 mb-10 font-light">سوالی دارید؟ خوشحال می‌شم کمک کنم</p>
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 text-right">
              <input type="text" name="name" required className="input-glass w-full px-5 py-3 rounded-xl text-white placeholder:text-zinc-500 focus:border-orange-500/50 outline-none transition-colors text-sm" placeholder="نام و نام خانوادگی" />
              <input type="email" name="email" required className="input-glass w-full px-5 py-3 rounded-xl text-white placeholder:text-zinc-500 focus:border-orange-500/50 outline-none transition-colors text-sm" placeholder="آدرس ایمیل" />
              <textarea name="message" required rows={4} className="input-glass w-full px-5 py-3 rounded-xl text-white placeholder:text-zinc-500 focus:border-orange-500/50 outline-none transition-colors resize-none text-sm" placeholder="پیام خود را بنویسید..."></textarea>
              <button type="submit" className="btn-primary w-full">ارسال پیام</button>
            </form>
            <div className="grid sm:grid-cols-3 gap-4 mt-10">
              {[
                { icon: '📞', text: '۰۹۱۳۳۲۸۷۹۸۴', sub: '۰۹۱۰۸۳۰۸۷۹۹' },
                { icon: '✉️', text: 'info@ehsansalehi.ir' },
                { icon: '📍', text: 'اصفهان، ایران' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-5 glass rounded-xl">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-medium text-sm">{item.text}</p>
                  {item.sub && <p className="text-zinc-500 text-xs font-light">{item.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="py-8 text-center border-t border-white/5 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-zinc-500 text-xs font-light">© ۱۴۰۴ احسان صالحی – تمامی حقوق محفوظ است</p>
            <SocialLinks />
          </div>
        </footer>

        <BackToTop />
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
                this.size = Math.random() * 1.2 + 0.3;
                this.speedX = (Math.random() - 0.5) * 0.2;
                this.speedY = (Math.random() - 0.5) * 0.2;
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
                ctx.fillStyle = 'rgba(255, 107, 0, 0.2)';
                ctx.fill();
              }
            }

            for (let i = 0; i < 45; i++) {
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
                    ctx.strokeStyle = \`rgba(255, 107, 0, \${0.04 * (1 - dist / 100)})\`;
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
