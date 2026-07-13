export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir pt-24 px-4 pb-20 max-w-6xl mx-auto" dir="rtl">
      {/* Header card skeleton */}
      <div className="glass rounded-2xl p-6 border border-white/10 animate-pulse mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800/80"></div>
          <div className="space-y-2">
            <div className="h-6 w-40 bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-52 bg-zinc-800/60 rounded-lg"></div>
          </div>
        </div>
        <div className="h-10 w-24 bg-red-500/20 rounded-xl"></div>
      </div>

      {/* Content cards skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-6 border border-white/5 animate-pulse space-y-4">
            <div className="h-6 w-32 bg-zinc-800 rounded-lg mb-4"></div>
            <div className="h-16 w-full bg-zinc-800/40 rounded-xl"></div>
            <div className="h-16 w-full bg-zinc-800/40 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
