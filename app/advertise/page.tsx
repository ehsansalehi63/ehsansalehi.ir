import { Suspense } from 'react';
import AdvertiseContent from './AdvertiseContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تعرفه رپورتاژ آگهی و تبلیغات در پایگاه خبری | احسان صالحی',
  description: 'انتشار دائمی رپورتاژ آگهی، بک‌لینک فالو و تبلیغات بنری در پایگاه جامع خبری فناوری و هوش مصنوعی احسان صالحی با ایندکس سریع سرچ کنسول و بازنشر در لینکدین و تلگرام.',
  keywords: ['رپورتاژ آگهی', 'خرید رپورتاژ', 'تبلیغات در سایت IT', 'بک لینک فالو', 'اخبار رمزارز', 'احسان صالحی'],
};

export default function AdvertisePage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white py-24 px-4 font-vazir">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={
          <div className="text-center text-zinc-400 py-24">
            در حال بارگذاری تعرفه‌های رپورتاژ و تبلیغات...
          </div>
        }>
          <AdvertiseContent />
        </Suspense>
      </div>
    </main>
  );
}
