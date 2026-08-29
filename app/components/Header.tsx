import Link from "next/link";
import { Search } from "lucide-react";

const navItems = [
  { href: "/", label: "خانه" },
  { href: "/category/pesaraneh", label: "پسرانه" },
  { href: "/category/dokhtaraneh", label: "دخترانه" },
  { href: "/category/nozad", label: "نوزاد" },
  { href: "/category/madreseh", label: "لباس مدرسه" },
  { href: "/blog", label: "بلاگ" },
  { href: "/contact", label: "تماس با ما" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/90 backdrop-blur">
      {/* نوار اطلاع‌رسانی */}
      <div className="bg-violet-700 py-1.5 text-center text-xs font-medium text-white">
        🎁 ارسال رایگان برای سفارش‌های بالای ۲ میلیون تومان — بازگشت ۷ روزه تضمینی
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* لوگو */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg shadow-sm">
            👑
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-lg font-extrabold tracking-tight text-stone-900">
              مینی رویال
            </span>
            <span className="text-[11px] font-medium text-stone-500">
              پوشاک کودک و نوجوان
            </span>
          </span>
        </Link>

        {/* جستجو */}
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="جستجو در لباس‌های بچه‌ها…"
            className="w-full rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            aria-label="جستجو"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        </div>

        {/* اکسشن‌ها */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="دسته‌بندی اصلی">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-violet-50 hover:text-violet-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-violet-300 hover:bg-violet-50"
          >
            ورود
          </Link>
          <Link
            href="/cart"
            className="relative rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800"
            aria-label="سبد خرید"
          >
            سبد خرید
            <span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-stone-900">
              ۰
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}