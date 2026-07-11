export default function Certifications() {
  const certs = [
    { name: 'Network+', icon: '🌐' },
    { name: 'Veeam Certified', icon: '💾' },
    { name: 'ESXI / Vcenter', icon: '🖥️' },
    { name: 'Kerio Control', icon: '🔒' },
    { name: 'Next.js Expert', icon: '⚛️' },
    { name: 'ITIL Foundation', icon: '📊' },
  ];

  return (
    <section className="py-16 px-4 section-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-orange-400 text-sm font-medium tracking-wider">گواهینامه‌ها</span>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">افتخارات و مدارک</h2>
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          {certs.map((cert, i) => (
            <div key={i} className="glass px-6 py-3 rounded-full border border-white/5 hover:border-orange-500/30 transition-all duration-300 flex items-center gap-2">
              <span>{cert.icon}</span>
              <span className="text-sm font-medium">{cert.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
