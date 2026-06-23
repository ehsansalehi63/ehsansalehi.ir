'use client';

import { useEffect, useState, useRef } from "react";
import { Toaster, toast } from "sonner";
import Image from "next/image";

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
    setText(fullText);
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // دریافت پروژه‌ها از دیتابیس
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProjects(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // بررسی وضعیت لاگین
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

  const skills = [
    "WordPress", "Network+", "ESXI & Vcenter", "Veeam", "Kerio Control",
    "Next.js", "Tailwind CSS", "TypeScript", "IT Management", "Hardware Repair"
  ];

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

  // لیست پروژه‌های واقعی (اگر از دیتابیس نیامد، اینها نمایش داده شوند)
  const defaultProjects = [
    { _id: '1', title: "شبکه هولدینگ تجارت بین‌الملل دانا", desc: "اجرا، تامین و تجهیز کامل شبکه سازمانی", tech: "Cisco, Fortinet, Veeam", link: "#" },
    { _id: '2', title: "شبکه هولدینگ پارس پندار نهاد", desc: "اجرا و تجهیز شبکه کامل", tech: "Network Infrastructure", link: "#" },
    { _id: '3', title: "شبکه شرکت دانش‌بنیان آرین بهرنگ", desc: "اجرا و تجهیز شبکه سازمانی", tech: "Networking", link: "#" },
    { _id: '4', title: "شبکه آموزشگاه فن پردازان", desc: "راه‌اندازی شبکه کامل", tech: "Network Setup", link: "#" },
    { _id: '5', title: "بازگردانی اطلاعات Qnap شهرداری اصفهان", desc: "بازگردانی و بازیابی اطلاعات", tech: "Qnap, Data Recovery", link: "#" },
    { _id: '6', title: "سایت deltadasht.com و drmoeini.ir", desc: "طراحی و راه‌اندازی سایت‌های حرفه‌ای", tech: "WordPress, Elementor", link: "#" },
  ];

  const displayProjects = projects.length > 0 ? projects : defaultProjects;

  const navItems = [
    { name: "خانه", href: "#" },
    { name: "درباره", href: "#about" },
    { name: "خدمات", href: "#services" },
    { name: "مهارت‌ها", href: "#skills" },
    { name: "پروژه‌ها", href: "#projects" },
    { name: "تماس", href: "#contact" },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
      direction: 'rtl',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box'
    }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow-x: hidden; }
        .nav-link { 
          color: #d4d4d4; 
          text-decoration: none; 
          font-size: 14px; 
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-link:hover { 
          color: white; 
          background: rgba(255,255,255,0.05);
        }
        .mobile-nav-link {
          color: #d4d4d4;
          text-decoration: none;
          font-size: 16px;
          padding: 10px 20px;
          width: 100%;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s;
        }
        .mobile-nav-link:hover {
          color: white;
          background: rgba(255,255,255,0.05);
        }
        .btn-primary {
          padding: 10px 20px;
          background: white;
          color: black;
          border-radius: 12px;
          font-weight: 500;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-primary:hover { background: #e5e5e5; }
        .btn-secondary {
          padding: 10px 20px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          color: white;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.05); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
        .service-hover:hover { transform: scale(1.03); box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
        .skill-hover:hover { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.6); }
        .btn-auth { 
          padding: 6px 14px; 
          border-radius: 8px; 
          font-size: 13px; 
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-auth-login { color: #60a5fa; }
        .btn-auth-login:hover { background: rgba(59,130,246,0.1); }
        .btn-auth-register { 
          background: rgba(59,130,246,0.15); 
          color: #60a5fa; 
        }
        .btn-auth-register:hover { background: rgba(59,130,246,0.25); }
        .btn-auth-logout { 
          color: #ef4444; 
          background: none; 
          border: none; 
          cursor: pointer; 
          font-family: inherit;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 8px;
        }
        .btn-auth-logout:hover { background: rgba(239,68,68,0.1); }
        .btn-auth-dashboard { color: #60a5fa; }
        .btn-auth-dashboard:hover { background: rgba(59,130,246,0.1); }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center !important; }
          .hero-text { text-align: center !important; }
          .hero-buttons { justify-content: center !important; }
          .about-grid { grid-template-columns: 1fr !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .projects-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .profile-image { width: 180px !important; height: 180px !important; }
          .section-title { font-size: 24px !important; }
          .hero-title { font-size: 28px !important; }
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
          .nav-auth-desktop { display: none !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-toggle { display: none !important; }
          .nav-mobile-menu { display: none !important; }
          .nav-auth-mobile { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 16px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <a href="#" style={{
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontWeight: 'bold',
            color: 'white',
            textDecoration: 'none',
          }}>احسان صالحی</a>
          
          {/* منوی دسکتاپ */}
          <nav className="nav-desktop" style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            {navItems.map((item) => (
              <a key={item.name} href={item.href} className="nav-link">
                {item.name}
              </a>
            ))}
            
            {/* گزینه‌های احراز هویت - دسکتاپ */}
            <span className="nav-auth-desktop" style={{ display: 'flex', gap: '4px', alignItems: 'center', marginRight: '8px' }}>
              {user ? (
                <>
                  <a href="/dashboard" className="btn-auth btn-auth-dashboard">داشبورد</a>
                  <button onClick={handleLogout} className="btn-auth btn-auth-logout">خروج</button>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="btn-auth btn-auth-login">ورود</a>
                  <a href="/auth/register" className="btn-auth btn-auth-register">ثبت نام</a>
                </>
              )}
            </span>
          </nav>

          {/* دکمه منوی موبایل */}
          <button 
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* منوی موبایل */}
        {mobileMenuOpen && (
          <div className="nav-mobile-menu" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(10,10,10,0.98)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '8px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {navItems.map((item) => (
              <a 
                key={item.name} 
                href={item.href} 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            
            {/* گزینه‌های احراز هویت - موبایل */}
            <div className="nav-auth-mobile" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px', paddingTop: '8px' }}>
              {user ? (
                <>
                  <a href="/dashboard" className="mobile-nav-link" style={{ color: '#60a5fa' }}>داشبورد</a>
                  <button onClick={handleLogout} className="mobile-nav-link" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="mobile-nav-link" style={{ color: '#60a5fa' }}>ورود</a>
                  <a href="/auth/register" className="mobile-nav-link" style={{ color: '#60a5fa' }}>ثبت نام</a>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 16px 40px',
      }}>
        <div className="hero-grid" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          alignItems: 'center',
          width: '100%',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            order: '2',
          }}>
            <div className="profile-image" style={{
              width: 'clamp(160px, 25vw, 280px)',
              height: 'clamp(160px, 25vw, 280px)',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid rgba(59,130,246,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              flexShrink: 0,
            }}>
              <Image
                src="/images/profile.jpg"
                alt="احسان صالحی رباطی"
                width={280}
                height={280}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                priority
              />
            </div>
          </div>

          <div className="hero-text" style={{
            textAlign: 'right',
            order: '1',
          }}>
            <div style={{
              display: 'inline-block',
              marginBottom: '12px',
              padding: '4px 14px',
              background: 'rgba(59,130,246,0.1)',
              borderRadius: '9999px',
              color: '#60a5fa',
              fontSize: 'clamp(11px, 1.2vw, 14px)',
            }}>متخصص IT با ۱۶ سال تجربه</div>
            
            <h1 className="hero-title" style={{
              fontSize: 'clamp(28px, 5vw, 56px)',
              fontWeight: 'bold',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}>
              {text}
              <span style={{ animation: 'pulse 1s infinite' }}>|</span>
            </h1>
            
            <p style={{
              fontSize: 'clamp(16px, 1.8vw, 24px)',
              color: '#a3a3a3',
              marginBottom: '12px',
            }}>توسعه‌دهنده وب • متخصص شبکه و زیرساخت</p>
            
            <p style={{
              color: '#737373',
              marginBottom: '24px',
              fontSize: 'clamp(14px, 1.2vw, 18px)',
              maxWidth: '500px',
            }}>۱۶ سال تجربه در اجرا و تجهیز شبکه‌های سازمانی، طراحی سایت و مدیریت IT</p>
            
            <div className="hero-buttons" style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
            }}>
              <a href="#about" className="btn-primary">درباره من</a>
              <a href="#services" className="btn-secondary">خدمات من</a>
              <a href="#projects" className="btn-secondary">نمونه‌کارها</a>
              <a href="#contact" className="btn-secondary">تماس</a>
            </div>
          </div>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#4b5563',
          animation: 'bounce 2s infinite',
          fontSize: '24px',
        }}>↓</div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{
        padding: '60px 16px',
        background: 'rgba(24,24,27,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 className="section-title" style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
          }}>درباره من</h2>
          <p style={{
            color: '#a3a3a3',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: 'clamp(14px, 1.2vw, 18px)',
          }}>۱۶ سال تجربه واقعی در فناوری اطلاعات</p>
          
          <div className="about-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            textAlign: 'right',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <p style={{ color: '#d4d4d4', lineHeight: 1.8, fontSize: 'clamp(14px, 1.1vw, 16px)' }}>
                با بیش از ۱۶ سال سابقه کاری مستمر، تجربه گسترده‌ای در طراحی و اجرای شبکه‌های سازمانی، مدیریت IT، طراحی سایت وردپرسی و پشتیبانی فنی دارم.
              </p>
              <p style={{ color: '#d4d4d4', lineHeight: 1.8, fontSize: 'clamp(14px, 1.1vw, 16px)' }}>
                از پروژه‌های بزرگ دولتی و هولدینگ‌ها تا شرکت‌های دانش‌بنیان، همیشه بر ارائه راه‌حل‌های پایدار و حرفه‌ای تمرکز داشته‌ام.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px', color: '#60a5fa' }}>📅</span>
                <div>
                  <div style={{ color: '#60a5fa', fontSize: '13px' }}>۱۳۸۸ - تاکنون</div>
                  <h3 style={{ fontSize: 'clamp(16px, 1.3vw, 20px)', fontWeight: 'bold' }}>تجربه گسترده IT و شبکه</h3>
                  <p style={{ color: '#a3a3a3', fontSize: 'clamp(13px, 1vw, 15px)' }}>سرپرست IT در اداره کار، فرمانداری و شرکت‌های خصوصی</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px', color: '#60a5fa' }}>💻</span>
                <div>
                  <div style={{ color: '#60a5fa', fontSize: '13px' }}>تخصص طراحی سایت</div>
                  <h3 style={{ fontSize: 'clamp(16px, 1.3vw, 20px)', fontWeight: 'bold' }}>وردپرس حرفه‌ای</h3>
                  <p style={{ color: '#a3a3a3', fontSize: 'clamp(13px, 1vw, 15px)' }}>طراحی سایت deltadasht.com و drmoeini.ir</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px', color: '#60a5fa' }}>🖥️</span>
                <div>
                  <div style={{ color: '#60a5fa', fontSize: '13px' }}>شبکه و سخت‌افزار</div>
                  <h3 style={{ fontSize: 'clamp(16px, 1.3vw, 20px)', fontWeight: 'bold' }}>اجرا و تجهیز شبکه‌های سازمانی</h3>
                  <p style={{ color: '#a3a3a3', fontSize: 'clamp(13px, 1vw, 15px)' }}>هولدینگ‌ها، ادارات دولتی و شرکت‌های دانش‌بنیان</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: '60px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
          }}>خدمات من</h2>
          <p style={{
            color: '#a3a3a3',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: 'clamp(14px, 1.2vw, 18px)',
          }}>راه‌حل‌های تخصصی برای کسب‌وکار شما</p>
          
          <div className="services-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}>
            {[
              { icon: '🌐', title: "طراحی و توسعه سایت", desc: "سایت وردپرسی حرفه‌ای، فروشگاهی و شرکتی" },
              { icon: '🖥️', title: "شبکه و زیرساخت IT", desc: "طراحی، اجرا و تجهیز شبکه‌های سازمانی" },
              { icon: '🤖', title: "پشتیبانی و اتوماسیون", desc: "هلپ‌دسک، تعمیرات سخت‌افزار و اتوماسیون اداری" }
            ].map((service, idx) => (
              <div key={idx} className="service-hover" style={{
                background: '#18181b',
                padding: '20px',
                borderRadius: '16px',
                transition: 'all 0.3s',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 'clamp(32px, 4vw, 40px)', marginBottom: '12px' }}>{service.icon}</div>
                <h3 style={{ fontSize: 'clamp(16px, 1.3vw, 20px)', fontWeight: 'bold', marginBottom: '6px' }}>{service.title}</h3>
                <p style={{ color: '#a3a3a3', fontSize: 'clamp(13px, 1vw, 15px)' }}>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" style={{
        padding: '60px 16px',
        background: 'rgba(24,24,27,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: 'clamp(28px, 3vw, 32px)' }}>🏆</span>
            <h2 className="section-title" style={{
              fontSize: 'clamp(24px, 4vw, 40px)',
              fontWeight: 'bold',
            }}>مهارت‌های تخصصی</h2>
          </div>
          <p style={{
            color: '#a3a3a3',
            marginBottom: '24px',
            fontSize: 'clamp(14px, 1.2vw, 18px)',
          }}>فناوری‌ها و تخصص‌های من</p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}>
            {skills.map((skill, idx) => (
              <span key={idx} className="skill-hover" style={{
                padding: '6px 14px',
                background: '#27272a',
                borderRadius: '9999px',
                fontSize: 'clamp(12px, 1vw, 14px)',
                color: '#93c5fd',
                border: '1px solid rgba(59,130,246,0.15)',
                transition: 'all 0.2s',
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" style={{ padding: '60px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="section-title" style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
          }}>نمونه‌کارها</h2>
          <p style={{
            color: '#a3a3a3',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: 'clamp(14px, 1.2vw, 18px)',
          }}>پروژه‌های منتخب</p>
          
          <div className="projects-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {loading ? (
              <p style={{ color: '#737373', gridColumn: '1 / -1', textAlign: 'center' }}>در حال بارگذاری...</p>
            ) : (
              displayProjects.map((project: any) => (
                <div key={project._id} className="card-hover" style={{
                  background: '#18181b',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                }}>
                  <div style={{
                    height: '140px',
                    background: 'linear-gradient(to right, rgba(30,58,138,0.3), #18181b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    opacity: 0.3,
                  }}>💼</div>
                  <div style={{ padding: '16px', textAlign: 'right' }}>
                    <h3 style={{ fontSize: 'clamp(16px, 1.3vw, 18px)', fontWeight: 'bold', marginBottom: '6px' }}>{project.title}</h3>
                    <p style={{ color: '#a3a3a3', fontSize: 'clamp(13px, 1vw, 14px)', marginBottom: '8px' }}>{project.desc}</p>
                    <div style={{ color: '#60a5fa', fontSize: 'clamp(11px, 0.9vw, 12px)', marginBottom: '8px' }}>{project.tech}</div>
                    <a href={project.link || "#"} style={{
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: 'clamp(13px, 1vw, 14px)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'color 0.2s',
                    }} onMouseEnter={(e) => e.currentTarget.style.color = '#60a5fa'} onMouseLeave={(e) => e.currentTarget.style.color = 'white'}>
                      جزئیات پروژه →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{
        padding: '60px 16px',
        background: 'rgba(24,24,27,0.15)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}>تماس با من</h2>
          <p style={{
            color: '#a3a3a3',
            marginBottom: '24px',
            fontSize: 'clamp(14px, 1.2vw, 18px)',
          }}>برای مشاوره، پروژه جدید یا همکاری در ارتباط باشید</p>
          
          <form ref={formRef} onSubmit={handleSubmit} style={{
            maxWidth: '600px',
            margin: '0 auto 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'right',
          }}>
            <input type="text" name="name" required style={{
              padding: '10px 14px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '12px',
              color: 'white',
              fontSize: 'clamp(14px, 1vw, 16px)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }} placeholder="نام و نام خانوادگی" onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#3f3f46'} />
            
            <input type="email" name="email" required style={{
              padding: '10px 14px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '12px',
              color: 'white',
              fontSize: 'clamp(14px, 1vw, 16px)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }} placeholder="آدرس ایمیل" onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#3f3f46'} />
            
            <textarea name="message" required rows={4} style={{
              padding: '10px 14px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '12px',
              color: 'white',
              fontSize: 'clamp(14px, 1vw, 16px)',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 0.2s',
            }} placeholder="متن پیام..." onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#3f3f46'} />
            
            <button type="submit" style={{
              padding: '10px',
              background: '#2563eb',
              borderRadius: '12px',
              fontWeight: '500',
              border: 'none',
              color: 'white',
              fontSize: 'clamp(14px, 1vw, 16px)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }} onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>
              ارسال پیام
            </button>
          </form>

          <div className="contact-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>📞</span>
              <p style={{ fontSize: 'clamp(13px, 1vw, 15px)' }}>۰۹۱۳۳۲۸۷۹۸۴</p>
              <p style={{ color: '#737373', fontSize: 'clamp(12px, 0.9vw, 13px)' }}>۰۹۱۰۸۳۰۸۷۹۹</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>✉️</span>
              <p style={{ fontSize: 'clamp(13px, 1vw, 15px)' }}>info@ehsansalehi.ir</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>📍</span>
              <p style={{ fontSize: 'clamp(13px, 1vw, 15px)' }}>اصفهان و حومه</p>
            </div>
          </div>

          <a href="https://wa.me/989133287984" target="_blank" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#16a34a',
            borderRadius: '12px',
            color: 'white',
            textDecoration: 'none',
            fontSize: 'clamp(14px, 1vw, 16px)',
            transition: 'background 0.2s',
          }} onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'} onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}>
            پیام در واتساپ
          </a>
        </div>
      </section>

      <footer style={{
        padding: '20px 16px',
        textAlign: 'center',
        color: '#737373',
        fontSize: 'clamp(12px, 0.9vw, 14px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <p>© ۱۴۰۵ احسان صالحی رباطی - تمام حقوق محفوظ است</p>
        <p style={{ marginTop: '4px' }}>ساخته شده با Next.js</p>
      </footer>

      <Toaster position="top-center" richColors />
    </div>
  );
}
// new deploy
