'use client';
import { useI18n } from './I18nProvider';

export default function Certifications() {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const certs = [
    { name: 'Network+', icon: '🌐' },
    { name: 'Veeam Certified Specialist', icon: '💾' },
    { name: 'VMware ESXi / vCenter Architect', icon: '🖥️' },
    { name: 'Kerio Control & Firewall Security', icon: '🔒' },
    { name: 'Next.js 16 Cloud Architect', icon: '⚛️' },
    { name: 'ITIL Enterprise IT Service Management', icon: '📊' },
  ];

  return (
    <section className="py-16 px-4 section-hidden font-vazir" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-orange-400 text-sm font-medium tracking-wider">
          {isEn ? 'Certifications & Honors' : 'گواهینامه‌ها'}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
          {isEn ? 'Professional IT Credentials' : 'افتخارات و مدارک'}
        </h2>
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          {certs.map((cert, i) => (
            <div key={i} className="glass px-6 py-3 rounded-full border border-white/5 hover:border-orange-500/30 transition-all duration-300 flex items-center gap-2 shadow-sm">
              <span>{cert.icon}</span>
              <span className="text-sm font-bold text-zinc-200">{cert.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
