'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '../../components/I18nProvider';
import NewsComments from '../../components/NewsComments';
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Share2, ShieldCheck } from 'lucide-react';

export default function NewsDetailView({ news, newsId }: { news: any; newsId: number }) {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const formatDate = (date: string) => {
    const d = new Date(date);
    return isEn 
      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const title = isEn ? (news.title_en || news.title) : news.title;
  const summary = isEn ? (news.summary_en || news.summary) : news.summary;
  const content = isEn ? (news.content_en || news.content) : news.content;
  const category = isEn 
    ? (news.category === 'رمزارز و بلاکچین' ? 'Crypto & Blockchain 🪙' : news.category === 'هوش مصنوعی' ? 'Artificial Intelligence 🤖' : news.category === 'امنیت سایبری' ? 'Cyber Security 🔒' : news.category === 'سخت‌افزار و گجت' ? 'Hardware & Gadgets 📱' : 'Tech & IT News 💻')
    : (news.category || 'فناوری و رمزارز');

  const readingTime = Math.max(2, Math.ceil((content?.length || 1000) / 400));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4 font-vazir" dir={isEn ? 'ltr' : 'rtl'}>
      <article className="max-w-4xl mx-auto">
        
        {/* Back Link & Category */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link 
            href="/news" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-orange-400 hover:text-white transition-all text-xs font-bold group shadow-sm"
          >
            {isEn ? (
              <>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Tech & Crypto News Portal</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                <span>بازگشت به پایگاه اخبار فناوری و رمزارز</span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs shadow-md">
              {category}
            </span>
            {news.source_name && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-zinc-300 border border-white/10 text-xs font-bold">
                {isEn ? 'Source:' : 'منبع:'} {news.source_name}
              </span>
            )}
          </div>
        </div>

        {/* Featured Cover Image */}
        {news.image_url && !news.image_url.includes('placehold') && (
          <div className="relative w-full h-[360px] sm:h-[450px] rounded-3xl overflow-hidden mb-10 border border-white/15 shadow-[0_20px_70px_rgba(255,107,0,0.15)] group">
            <img 
              src={news.image_url} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            <div className={`absolute bottom-6 ${isEn ? 'left-6' : 'right-6'} flex items-center gap-4 text-xs font-bold text-zinc-200 bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10`}>
              <span>📅 {formatDate(news.published_at)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400"><Clock size={13} /> {readingTime} {isEn ? 'Min Read' : 'دقیقه مطالعه'}</span>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-8 tracking-tight">
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-blue-400 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>

        {/* Executive Summary Callout */}
        {summary && (
          <div className={`text-base sm:text-lg md:text-xl text-zinc-200 leading-relaxed ${isEn ? 'border-l-4 pl-6' : 'border-r-4 pr-6'} border-orange-500 bg-gradient-to-r from-orange-500/10 via-black to-blue-500/10 p-6 sm:p-8 rounded-3xl mb-10 shadow-xl border border-white/10 font-medium`}>
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider mb-2">
              <ShieldCheck size={16} /> {isEn ? 'AI Executive Analysis & Highlights' : 'خلاصه تحلیلی و نکات کلیدی هوش مصنوعی'}
            </div>
            {summary}
          </div>
        )}

        {/* Video if present */}
        {news.video_url && (
          <div className="mb-10 rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
            <video controls className="w-full aspect-video" poster={news.image_url || undefined} preload="metadata">
              <source src={news.video_url} type="video/mp4" />
              {isEn ? 'Your browser does not support video playback.' : 'مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.'}
            </video>
          </div>
        )}

        {/* Main Content Paragraphs */}
        <div className="prose prose-lg prose-invert max-w-none space-y-6 text-zinc-300 font-light leading-[2.2] text-base sm:text-lg">
          {content?.split('\n').map((paragraph: string, index: number) => {
            if (!paragraph.trim()) return null;
            return <p key={index} className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">{paragraph}</p>;
          })}
        </div>

        {/* Original Source / External Link Callout */}
        {news.original_url && (
          <div className="mt-12 p-6 rounded-3xl bg-zinc-900/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white mb-1">
                {isEn ? 'Verify & Read Original English Source Article' : 'مشاهده و مطالعه خبر اصلی از منبع معتبر انگلیسی'}
              </h4>
              <p className="text-xs text-zinc-400">
                {isEn ? `Source: ${news.source_name || 'Original Publisher'}` : `منبع خبر: ${news.source_name || 'ناشر اصلی'}`}
              </p>
            </div>
            <a
              href={news.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition flex items-center gap-2 shrink-0 shadow-lg shadow-orange-500/20"
            >
              <span>{isEn ? 'Open Source Link' : 'مشاهده لینک منبع'}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* ====== Comments Section ====== */}
        <div className="mt-16 pt-10 border-t border-white/10">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            {isEn ? 'Discussion & Comments' : 'دیدگاه‌ها و نظرات کاربران'}
          </h3>
          <NewsComments newsId={newsId} />
        </div>
      </article>
    </main>
  );
}
