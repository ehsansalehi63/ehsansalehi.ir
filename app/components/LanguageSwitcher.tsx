'use client';
import React from 'react';
import { useI18n } from './I18nProvider';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      onClick={toggleLang}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-orange-500/20 border border-white/15 hover:border-orange-500/50 text-xs font-bold text-white transition-all shadow-md shrink-0"
      aria-label="تغییر زبان سایت (Change Language)"
    >
      <Globe size={14} className="text-amber-400 animate-pulse" />
      <span>{lang === 'fa' ? '🇬🇧 English' : '🇮🇷 فارسی'}</span>
    </button>
  );
}
