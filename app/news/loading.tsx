export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir pt-28 px-4 pb-20 max-w-7xl mx-auto" dir="rtl">
      {/* Title skeleton */}
      <div className="h-10 w-72 bg-zinc-800/60 rounded-xl animate-pulse mx-auto mb-4"></div>
      <div className="h-6 w-80 max-w-full bg-zinc-800/40 rounded-xl animate-pulse mx-auto mb-16"></div>

      {/* News list grid skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-2xl animate-pulse overflow-hidden border border-white/5 p-5 space-y-4">
            <div className="w-full h-48 bg-zinc-800/50 rounded-xl"></div>
            <div className="h-6 w-full bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-5/6 bg-zinc-800/60 rounded-lg"></div>
            <div className="pt-3 flex justify-between items-center border-t border-white/5">
              <div className="h-4 w-20 bg-zinc-800/50 rounded-md"></div>
              <div className="h-8 w-24 bg-blue-600/20 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
