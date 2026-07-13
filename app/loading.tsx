export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(245,158,11,0.3)]"></div>
      <p className="text-zinc-400 font-medium animate-pulse text-lg">در حال بارگذاری اطلاعات...</p>
    </div>
  );
}
