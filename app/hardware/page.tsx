import { Suspense } from 'react';
import HardwareContent from './HardwareContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لپ‌تاپ‌های استوک مهندسی و سخت‌افزار Grade A++ | گلچین‌شده توسط احسان صالحی',
  description: 'فروش و مشاوره خرید تخصصی لپ‌تاپ‌های مهندسی، برنامه‌نویسی و استوک اروپایی (Grade A++) ۱۰۰٪ تست‌شده و تاییدشده توسط مهندس احسان صالحی با ۲۰ سال تجربه.',
  keywords: ['لپ تاپ استوک', 'لپ تاپ مهندسی', 'خرید لپ تاپ استوک', 'ThinkPad', 'MacBook Pro استوک', 'احسان صالحی', 'تجهیزات شبکه سیسکو'],
};

export default function HardwarePage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white py-24 px-4 font-vazir">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={
          <div className="text-center text-zinc-400 py-24">
            در حال بارگذاری لیست سخت‌افزارهای مهندسی و لپ‌تاپ‌های استوک...
          </div>
        }>
          <HardwareContent />
        </Suspense>
      </div>
    </main>
  );
}
