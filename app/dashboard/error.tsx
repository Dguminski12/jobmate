"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void fetch("/api/observability/error", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        source: "frontend",
        message: error.message || "Dashboard error boundary triggered.",
        stack: error.stack,
        metadata: {
          digest: error.digest ?? null,
          scope: "dashboard_error_boundary",
        },
      }),
    }).catch(() => {
      // Ignore client-side logging failures.
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-4xl border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Dashboard error</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">We couldn&apos;t load your jobs.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {error.message || "Something went wrong while loading JobMate."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
