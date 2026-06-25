import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

async function getProject(id: string) {
  const numId = parseInt(id);
  if (isNaN(numId)) return null;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', numId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

const projectDetails: Record<number, any> = {
  4: {
    fullDescription: "این پروژه شامل طراحی و پیاده‌سازی شبکه کامل برای هلدینگ تجارت بین‌الملل دانا بود...",
    challenges: ["یکپارچه‌سازی سیستم‌های قدیمی", "تامین امنیت در برابر تهدیدات سایبری"],
    solutions: ["طراحی شبکه با معماری سه‌لایه", "پیاده‌سازی فایروال‌های Fortinet"],
    result: "شبکه با ۹۹.۹۹٪ پایداری و امنیت بالا",
    myRole: "معمار شبکه و سرپرست تیم پیاده‌سازی",
    techStack: ["Cisco Catalyst", "Fortinet FortiGate", "Veeam Backup"]
  },
  5: {
    fullDescription: "پروژه هیئت حل اختلاف اداره کار اصفهان شامل اجرای شبکه سالن...",
    challenges: ["نیاز به امنیت بالا", "تامین اینترنت پایدار"],
    solutions: ["پیاده‌سازی VLAN‌های جداگانه", "استفاده از تجهیزات MikroTik"],
    result: "شبکه‌ای پایدار با امنیت بالا",
    myRole: "مشاور و مجری شبکه",
    techStack: ["MikroTik RouterOS", "Ubiquiti UniFi", "CAT6 Cabling"]
  },
  6: {
    fullDescription: "طراحی و راه‌اندازی سایت deltadasht.com...",
    challenges: ["طراحی جذاب", "بهینه‌سازی SEO"],
    solutions: ["استفاده از Elementor Pro", "پیاده‌سازی افزونه‌های SEO"],
    result: "سایت با سرعت لود عالی",
    myRole: "طراح و توسعه‌دهنده وردپرس",
    techStack: ["WordPress", "Elementor Pro", "PHP 8.1"]
  },
  7: {
    fullDescription: "سایت drmoeini.ir یک وب‌سایت شخصی و حرفه‌ای...",
    challenges: ["ساخت وب‌سایت ساده ولی حرفه‌ای", "سیستم جستجوی پیشرفته"],
    solutions: ["طراحی با قالب اختصاصی", "استفاده از افزونه‌های امنیتی"],
    result: "وب‌سایت با ۲۰۰+ مقاله",
    myRole: "توسعه‌دهنده وردپرس و مشاور امنیت",
    techStack: ["WordPress", "Custom Theme", "PHP 8.0"]
  }
};

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();
  const details = projectDetails[project.id] || {
    fullDescription: project.desc || 'توضیحات کامل این پروژه به زودی اضافه می‌شود.',
    challenges: ['اطلاعات تکمیلی به زودی اضافه می‌شود.'],
    solutions: ['اطلاعات تکمیلی به زودی اضافه می‌شود.'],
    result: 'نتیجه پروژه به زودی اضافه می‌شود.',
    myRole: 'نقش من در این پروژه به زودی اضافه می‌شود.',
    techStack: project.tech ? project.tech.split(',').map(t => t.trim()) : ['اطلاعات تکمیلی به زودی اضافه می‌شود.']
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            احسان صالحی
          </Link>
          <Link href="/" className="text-zinc-300 hover:text-white transition">
            بازگشت به خانه
          </Link>
        </div>
      </header>
      <main className="pt-24 px-4 max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-white/10">
          {project.image_url && (
            <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
              <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            {project.title}
          </h1>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-amber-400 mb-3">📋 درباره پروژه</h2>
            <p className="text-zinc-300 leading-relaxed">{details.fullDescription}</p>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ چالش‌ها</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {details.challenges.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-green-400 mb-2">✅ راه‌حل‌ها</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {details.solutions.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-400 mb-2">📈 نتیجه</h3>
            <p className="text-zinc-300">{details.result}</p>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-purple-400 mb-2">👤 نقش من</h3>
            <p className="text-zinc-300">{details.myRole}</p>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-amber-400 mb-2">🛠️ تکنولوژی‌ها</h3>
            <div className="flex flex-wrap gap-2">
              {details.techStack.map((tech: string) => (
                <span key={tech} className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300 border border-white/5">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          {project.link && project.link !== '#' && (
            <div className="mb-6">
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition">
                مشاهده پروژه <span>→</span>
              </a>
            </div>
          )}
          <div className="mt-8 text-sm text-zinc-500 border-t border-white/5 pt-4">
            تاریخ انتشار: {new Date(project.createdAt).toLocaleDateString('fa-IR')}
          </div>
          <Link href="/#projects" className="inline-block mt-6 text-zinc-400 hover:text-white transition">
            ← بازگشت به لیست پروژه‌ها
          </Link>
        </div>
      </main>
    </div>
  );
}
