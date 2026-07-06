import Image from 'next/image';
import Link from 'next/link';
import NewsSection from './components/NewsSection';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                احسان صالحی رباطی
                <span className="block text-blue-600 dark:text-blue-400 mt-2">متخصص IT با ۱۶ سال تجربه</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto md:mx-0">
                توسعه‌دهنده فول‌استک | مشاور فناوری اطلاعات | مدیر پروژه‌های نرم‌افزاری
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                <a href="#projects" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                  مشاهده پروژه‌ها
                </a>
                <a href="#contact" className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg border border-gray-200 dark:border-gray-700">
                  تماس با من
                </a>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-7xl text-white shadow-2xl animate-pulse">
                👨‍💻
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">درباره من</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center text-lg leading-relaxed">
            من احسان صالحی رباطی هستم، متخصص IT با ۱۶ سال تجربه در زمینه‌های مختلف فناوری اطلاعات. از توسعه نرم‌افزارهای وب و موبایل گرفته تا مشاوره و مدیریت پروژه‌های فناوری، همواره تلاش کرده‌ام با به‌روزترین دانش و ابزارها، راه‌حل‌های کارآمد و نوآورانه ارائه دهم.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">خدمات من</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all text-center">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">توسعه وب</h3>
              <p className="text-gray-600 dark:text-gray-300">طراحی و پیاده‌سازی وب‌سایت‌های مدرن با Next.js و React</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">توسعه موبایل</h3>
              <p className="text-gray-600 dark:text-gray-300">ساخت اپلیکیشن‌های موبایل با React Native و Flutter</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all text-center">
              <div className="text-5xl mb-4">🛠️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">مشاوره فناوری</h3>
              <p className="text-gray-600 dark:text-gray-300">ارائه راه‌حل‌های فنی و استراتژی‌های دیجیتال برای کسب‌وکارها</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">مهارت‌های فنی</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Next.js', 'React', 'TypeScript', 'Node.js', 'Python', 'Docker', 'Kubernetes', 'AWS', 'Git', 'Linux'].map(skill => (
              <span key={skill} className="px-6 py-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium shadow">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">پروژه‌های اخیر</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">پروژه {i+1}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">توضیحات پروژه</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">Next.js</span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">Tailwind</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="news" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">📰 آخرین اخبار تکنولوژی</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">جدیدترین رویدادهای دنیای فناوری</p>
            </div>
            <Link href="/news" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center">
              مشاهده همه اخبار
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <NewsSection />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">تماس با من</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام و نام خانوادگی</label>
              <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ایمیل</label>
              <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پیام</label>
              <textarea rows={5} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
              ارسال پیام
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
