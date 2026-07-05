export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef5ff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-8">
          <div className="h-8 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full max-w-3xl animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.75rem] border border-white/80 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)]" />
          ))}
        </div>

        <div className="h-20 animate-pulse rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)]" />
        <div className="h-80 animate-pulse rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)]" />
      </div>
    </main>
  );
}
