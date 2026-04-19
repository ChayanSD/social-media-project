export default function Loading() {
  return (
    <div className="min-h-screen bg-[#06133F] px-4 py-28 text-white">
      {/* Branded loading header */}
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-400" />
          </div>
          <p className="text-sm text-white/40 animate-pulse">Loading community marketplace…</p>
        </div>

        {/* Skeleton cards */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-white/10 bg-[#06133FBF] p-5 backdrop-blur-[17.5px]"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-white/10" />
                <div className="h-2 w-20 rounded bg-white/5" />
              </div>
            </div>
            <div className="mt-5 h-3 w-full rounded bg-white/10" />
            <div className="mt-3 h-3 w-3/4 rounded bg-white/8" />
            <div className="mt-5 h-36 rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
