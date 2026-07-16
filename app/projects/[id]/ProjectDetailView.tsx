'use client';
import React from 'react';
import Link from 'next/link';
import { useI18n } from '../../components/I18nProvider';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function ProjectDetailView({ project }: { project: any }) {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  let title = isEn ? (project.title_en || project.title) : project.title;
  let desc = isEn ? (project.desc_en || project.desc) : project.desc;

  if (isEn && (!project.title_en || /[آ-ی]/.test(title))) {
    if (project.title.includes('شبکه') || project.title.includes('مانیتورینگ')) {
      title = 'Enterprise Web-Based Network Automation & Monitoring Platform';
      desc = 'Architected and deployed a high-security network monitoring system featuring instant alerting, advanced traffic analytics, and automated SNMP device tracking.';
    } else if (project.title.includes('پلتفرم') || project.title.includes('مشاوره')) {
      title = 'Full-Stack IT & Cyber Security Consulting Platform';
      desc = 'Official web application for Eng. Ehsan Salehi built with Next.js 16 serverless architecture, AI breaking news translations, and enterprise SEO optimization.';
    } else if (project.title.includes('سامانه') || project.title.includes('اخبار')) {
      title = 'AI-Driven Technology & Crypto News Publishing Engine';
      desc = 'Autonomous news crawler gathering global tech and cryptocurrency updates, translating and summarizing via OpenAI LLMs, applying custom watermarks, and syndicating to social networks.';
    } else {
      title = 'Cloud IT Infrastructure & System Engineering Solution';
      desc = 'Delivered high-performance corporate infrastructure, custom backend development, and security hardening for enterprise scalability.';
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date);
    return isEn 
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            {isEn ? 'Ehsan Salehi' : 'احسان صالحی'}
          </Link>
          <Link href="/" className="text-zinc-300 hover:text-white transition text-xs sm:text-sm font-bold">
            {isEn ? '← Back to Homepage' : 'بازگشت به خانه ←'}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 px-4 pb-20 max-w-4xl mx-auto">
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
          {project.image_url && (
            <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-lg">
              <img
                src={project.image_url}
                alt={title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-black mb-6 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            {title}
          </h1>

          <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed font-light text-base sm:text-lg">
            <p className="mb-8 leading-[2.1]">{desc}</p>
          </div>

          {project.tech && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-amber-400 mb-3 uppercase tracking-wider">
                {isEn ? '🛠️ Technologies & Stack Used' : '🛠️ تکنولوژی‌ها و ابزارها'}
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {project.tech.split(',').map((tech: string) => (
                  <span key={tech.trim()} className="px-3.5 py-1.5 bg-white/5 rounded-xl text-xs font-bold text-zinc-200 border border-white/10">
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.link && project.link !== '#' && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-2xl text-black font-black transition shadow-lg shadow-orange-500/20 text-sm"
            >
              <span>{isEn ? 'View Live Project' : 'مشاهده پروژه'}</span>
              <ArrowRight size={16} className={isEn ? 'rotate-0' : 'rotate-180'} />
            </a>
          )}

          {project.createdAt && (
            <div className="mt-10 text-xs text-zinc-500 border-t border-white/10 pt-5 font-medium">
              {isEn ? 'Published Date: ' : 'تاریخ انتشار: '} {formatDate(project.createdAt)}
            </div>
          )}

          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 mt-6 text-zinc-400 hover:text-white transition text-xs font-bold"
          >
            {isEn ? '← Return to Projects Portfolio' : '← بازگشت به لیست پروژه‌ها'}
          </Link>
        </div>
      </main>
    </div>
  );
}
