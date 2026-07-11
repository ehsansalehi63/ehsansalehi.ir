export default function SocialCallout() {
  return (
    <section className="py-16 px-4 section-hidden bg-gradient-to-r from-orange-500/5 to-blue-500/5 border-y border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
          به ما بپیوندید
        </h2>
        <p className="text-zinc-400 mt-2 text-sm">
          ما را در شبکه‌های اجتماعی دنبال کنید و از آخرین اخبار و مطالب تخصصی مطلع شوید.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a href="https://t.me/ehsansalehi_tech" target="_blank" rel="noopener" className="glass px-6 py-3 rounded-full hover:border-orange-500/40 transition-all">
            <span className="text-orange-400">📱</span> تلگرام
          </a>
          <a href="https://wa.me/989133287984" target="_blank" rel="noopener" className="glass px-6 py-3 rounded-full hover:border-orange-500/40 transition-all">
            <span className="text-green-400">💬</span> واتساپ
          </a>
          <a href="https://linkedin.com/in/ehsansalehi" target="_blank" rel="noopener" className="glass px-6 py-3 rounded-full hover:border-orange-500/40 transition-all">
            <span className="text-blue-400">🔗</span> لینکدین
          </a>
        </div>
      </div>
    </section>
  );
}
