import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// دریافت اطلاعات یک پروژه از دیتابیس (در زمان درخواست)
async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', parseInt(id))
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

// صفحه جزئیات پروژه (SSR - هر بار از دیتابیس می‌خواند)
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
      {/* هدر */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            احسان صالحی
          </Link>
          <Link href="/" className="text-zinc-300 hover:text-white transition">
            بازگشت به خانه
          </Link>
        </div>
      </header>

      {/* محتوای اصلی */}
      <main className="pt-24 px-4 max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-8 border border-white/10">
          {/* عکس پروژه */}
          {project.image_url && (
            <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* عنوان */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            {project.title}
          </h1>

          {/* توضیحات */}
          <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
            <p className="text-lg mb-6">{project.desc}</p>
          </div>

          {/* تکنولوژی‌ها */}
          {project.tech && (
            <div className="mb-6">
              <h3 className="text-sm text-amber-400 font-bold mb-2">🛠️ تکنولوژی‌ها</h3>
              <div className="flex flex-wrap gap-2">
                {project.tech.split(',').map((tech: string) => (
                  <span key={tech.trim()} className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300 border border-white/5">
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* لینک پروژه */}
          {project.link && project.link !== '#' && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition"
            >
              مشاهده پروژه <span>→</span>
            </a>
          )}

          {/* تاریخ ایجاد */}
          <div className="mt-8 text-sm text-zinc-500 border-t border-white/5 pt-4">
            تاریخ انتشار: {new Date(project.createdAt).toLocaleDateString('fa-IR')}
          </div>

          {/* دکمه بازگشت */}
          <Link
            href="/#projects"
            className="inline-block mt-6 text-zinc-400 hover:text-white transition"
          >
            ← بازگشت به لیست پروژه‌ها
          </Link>
        </div>
      </main>
    </div>
  );
}

// (اختیاری) برای تولید صفحات استاتیک در زمان بیلد - اگر پروژه‌ها ثابت هستند
// اما با حذف این بخش، همه درخواست‌ها داینامیک می‌شوند.
