export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir pt-28 px-4 pb-20 max-w-7xl mx-auto" dir="rtl">
      {/* Title skeleton */}
      <div className="h-10 w-64 bg-zinc-800/60 rounded-xl animate-pulse mx-auto mb-4"></div>
      <div className="h-6 w-96 max-w-full bg-zinc-800/40 rounded-xl animate-pulse mx-auto mb-16"></div>

      {/* Cards grid skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="project-card animate-pulse border border-white/5">
            <div className="project-image bg-zinc-800/50 w-full h-[220px]"></div>
            <div className="p-6 space-y-3">
              <div className="h-6 w-3/4 bg-zinc-800 rounded-lg"></div>
              <div className="h-4 w-full bg-zinc-800/60 rounded-lg"></div>
              <div className="h-4 w-5/6 bg-zinc-800/40 rounded-lg"></div>
              <div className="pt-4 flex justify-between items-center border-t border-white/5">
                <div className="h-5 w-24 bg-zinc-800/60 rounded-md"></div>
                <div className="h-8 w-28 bg-amber-500/20 rounded-xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
