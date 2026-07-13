import React from 'react';

export default function SocialLinks({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const links = [
    { 
      name: 'تلگرام', 
      url: 'https://t.me/ehsansalehi_tech', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M21.5 4.5L2.5 11.5L9.5 14.5L12.5 21.5L21.5 4.5Z"/><path d="M9.5 14.5L17.5 6.5"/>
        </svg>
      )
    },
    { 
      name: 'واتساپ', 
      url: 'https://wa.me/989108308799', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      )
    },
    { 
      name: 'لینکدین', 
      url: 'https://www.linkedin.com/company/ehsansalehi-ir', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
        </svg>
      )
    },
    { 
      name: 'گیت‌هاب', 
      url: 'https://github.com/ehsansalehi63', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      )
    },
    { 
      name: 'ایمیل', 
      url: 'mailto:info@ehsansalehi.ir', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      )
    },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-6">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/40 text-zinc-300 hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/40"
          aria-label={link.name}
        >
          <span className="p-1.5 rounded-xl bg-black/40 group-hover:scale-110 transition-transform">
            {link.icon}
          </span>
          <span className="text-sm font-bold tracking-wide">{link.name}</span>
        </a>
      ))}
    </div>
  );
}
