import Link from "next/link";

const categories = [
  { title: "پسرانه", href: "/category/pesaraneh", emoji: "🧢", color: "from-sky-100 to-sky-50" },
  { title: "دخترانه", href: "/category/dokhtaraneh", emoji: "🎀", color: "from-rose-100 to-rose-50" },
  { title: "نوزاد", href: "/category/nozad", emoji: "🍼", color: "from-amber-100 to-amber-50" },
  { title: "لباس مدرسه", href: "/category/madreseh", emoji: "🎒", color: "from-emerald-100 to-emerald-50" },
  { title: "لباس مجلسی", href: "/category/majlesi", emoji: "✨", color: "from-violet-100 to-violet-50" },
  { title: "ست‌ها", href: "/category/set", emoji: "🧸", color: "from-orange-100 to-orange-50" },
];

const features = [
  { title: "ارسال سریع", desc: "به سراسر کشور با تیپاکس و پست", emoji: "🚚" },
  { title: "بازگشت ۷ روزه", desc: "اگر سایز نخورد، تعویض می‌کنیم", emoji: "↩️" },
  { title: "پرداخت در محل", desc: "خیال‌ت راحت، اول ببین بعد پرداخت کن", emoji: "💵" },
  { title: "پرو آنلاین لباس", desc: "قبل از خرید، لباس رو تنِ بچت ببین", emoji: "👗" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* هیرو */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="text-center lg:text-right">
            <span className="inline-block rounded-full bg-violet-100 px-4 py-1.5 text-xs font-semibold text-violet-700">
              ⭐ تمایز مینی رویال: تضمین سایز
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.3] text-stone-900 sm:text-5xl">
              لباس‌های خوشگل برای
              <span className="bg-gradient-to-l from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                {" "}
                بچه‌های ناز
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-stone-600 lg:mx-0">
              پوشاک باکیفیت پسرانه، دخترانه و نوزاد با جنس پارچه‌ی عالی. با
              پرو آنلاین لباس، قبل از خرید ببین لباس به تنِ فرزندت چه شکلی می‌شود؛
              دیگه خبری از سایز اشتباه نیست!
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/shop"
                className="rounded-full bg-violet-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800"
              >
                مشاهده فروشگاه
              </Link>
              <Link
                href="/virtual-tryon"
                className="rounded-full border-2 border-violet-200 bg-white px-7 py-3.5 text-sm font-bold text-violet-700 transition hover:border-violet-400 hover:bg-violet-50"
              >
                👗 پرو آنلاین لباس
              </Link>
            </div>
          </div>

          {/* جایگاه تصویر هیرو (در S1 با عکس واقعی جایگزین می‌شود) */}
          <div className="relative mx-auto grid size-72 place-items-center rounded-[2.5rem] bg-gradient-to-br from-violet-200 via-fuchsia-100 to-amber-100 text-8xl shadow-xl sm:size-96">
            <span className="animate-float">🧒</span>
            <span className="absolute -bottom-3 -right-3 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-stone-700 shadow-lg">
              تیشرت + شلوار = 💜
            </span>
          </div>
        </div>
      </section>

      {/* مزایا */}
      <section className="border-y border-stone-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-xl">
                {f.emoji}
              </span>
              <div>
                <h3 className="text-sm font-bold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-xs leading-5 text-stone-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* دسته‌بندی‌ها */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900">دسته‌بندی‌ها</h2>
            <p className="mt-1 text-sm text-stone-500">هر چیزی که بچه‌ها نیاز دارند</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-violet-700 hover:text-violet-900">
            مشاهده همه ←
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`group flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br ${c.color} p-6 text-center transition hover:-translate-y-1 hover:shadow-md`}
            >
              <span className="text-4xl transition group-hover:scale-110">{c.emoji}</span>
              <span className="text-sm font-bold text-stone-800">{c.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* بنر پرو آنلاین */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-violet-700 to-fuchsia-600 px-6 py-12 text-center text-white sm:px-12">
          <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 -right-10 size-52 rounded-full bg-white/10" />
          <h2 className="relative text-2xl font-black sm:text-3xl">
            نمی‌دونی این لباس به تنِ بچت می‌خوره؟
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-7 text-violet-100">
            با پرو آنلاین مینی رویال، قد و وزن کودک‌ات را وارد کن؛ سایز دقیق را با درصد
            اطمینان بهت می‌گوییم و لباس را روی آواتار کودک‌ات نشانت می‌دهیم.
          </p>
          <Link
            href="/virtual-tryon"
            className="relative mt-6 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-bold text-violet-700 shadow-lg transition hover:bg-violet-50"
          >
            امتحان کن — رایگان است
          </Link>
        </div>
      </section>

      {/* خبرنامه */}
      <section className="border-t border-stone-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h2 className="text-xl font-extrabold text-stone-900">
            از تخفیف‌ها زودتر با خبر شو 🎉
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            خبرنامه مینی رویال؛ تخفیف‌های ویژه و راهنمای سایز هر فصل.
          </p>
          <form className="mx-auto mt-5 flex max-w-md gap-2">
            <input
              type="email"
              placeholder="ایمیل یا شماره موبایل"
              className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
            <button
              type="submit"
              className="rounded-full bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-800"
            >
              عضویت
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}