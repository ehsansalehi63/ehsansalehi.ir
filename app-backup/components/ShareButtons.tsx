'use client';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    }
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      '_blank'
    );
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-sm text-zinc-400">اشتراک‌گذاری:</span>
      <button
        onClick={handleShare}
        className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-full transition-colors"
        aria-label="اشتراک‌گذاری"
      >
        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
        </svg>
      </button>
      <button
        onClick={handleTwitter}
        className="p-2 bg-sky-500/20 hover:bg-sky-500/40 rounded-full transition-colors"
        aria-label="اشتراک‌گذاری در توییتر"
      >
        <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.9 1 18.58c2.04 1.3 4.46 2.06 7.08 2.06 8.5 0 13.13-7.04 13.13-13.13 0-.2 0-.4-.02-.6.9-.63 1.68-1.42 2.3-2.33z" />
        </svg>
      </button>
      <button
        onClick={handleWhatsApp}
        className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-full transition-colors"
        aria-label="اشتراک‌گذاری در واتساپ"
      >
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.44 5.56c-2.43-2.43-5.57-3.36-8.73-2.79-.35.06-.7.15-1.04.25-3.36.98-6.07 3.7-7.04 7.04-.1.34-.19.69-.25 1.04-.57 3.16.36 6.3 2.79 8.73l2.76-2.76c-1.34-1.34-1.86-3.29-1.4-5.13.38-1.57 1.53-2.72 3.1-3.1 1.84-.46 3.79.06 5.13 1.4L20.44 5.56z" />
        </svg>
      </button>
    </div>
  );
}
