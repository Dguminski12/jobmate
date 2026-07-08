import Link from "next/link";
import SiteBrand from "@/components/brand/site-brand";
import SignOutButton from "@/components/auth/sign-out-button";
import ThemeToggle from "@/components/theme/theme-toggle";
import { getAdminDashboardData } from "@/lib/admin/server";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function normalizeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="rounded-4xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <SiteBrand href="/" showSubtitle={false} />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Admin dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Operational overview</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Monitor signups, AI usage, failures, audit activity and internal diagnostics for the first public
                release.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <Link
                href="/dashboard/packs"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                Back to app
              </Link>
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total users", value: data.stats.totalUsers.toString() },
            { label: "New users today", value: data.stats.newUsersToday.toString() },
            { label: "AI generations today", value: data.stats.totalAiGenerationsToday.toString() },
            { label: "AI generations this month", value: data.stats.totalAiGenerationsThisMonth.toString() },
            { label: "Failed generations today", value: data.stats.failedGenerationsToday.toString() },
            { label: "Estimated token cost today", value: formatCurrency(data.stats.estimatedTokenCostTodayGbp) },
            { label: "Estimated token cost this month", value: formatCurrency(data.stats.estimatedTokenCostThisMonthGbp) },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            >
              <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-4xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold tracking-tight">Recent audit log entries</h2>
            <div className="mt-4 space-y-3">
              {data.recentAuditLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No audit entries yet.</p>
              ) : (
                data.recentAuditLogs.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold text-slate-950">{entry.event_type}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">User: {entry.user_id ?? "anonymous/system"}</p>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-600">
                      {normalizeJson(entry.metadata)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-4xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold tracking-tight">Recent error logs</h2>
            <div className="mt-4 space-y-3">
              {data.recentErrorLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No error logs yet.</p>
              ) : (
                data.recentErrorLogs.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold text-rose-950">{entry.source}</p>
                      <p className="text-xs text-rose-800/70">{formatDateTime(entry.created_at)}</p>
                    </div>
                    <p className="mt-2 text-sm text-rose-900">{entry.message}</p>
                    <p className="mt-2 text-xs text-rose-800/70">User: {entry.user_id ?? "anonymous/system"}</p>
                    {entry.metadata ? (
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-rose-900/85">
                        {normalizeJson(entry.metadata)}
                      </pre>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-4xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold tracking-tight">Recent users</h2>
            <div className="mt-4 space-y-3">
              {data.recentUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">{user.full_name ?? "Unnamed user"}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.id}</p>
                  <p className="mt-2 text-xs text-slate-500">Joined {formatDateTime(user.created_at)}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-4xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold tracking-tight">Recent AI requests</h2>
            <div className="mt-4 space-y-3">
              {data.recentAiRequests.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {entry.action_type} · {entry.status}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">User: {entry.user_id}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Tokens: {entry.total_tokens ?? 0} · Cost:{" "}
                    {formatCurrency(typeof entry.estimated_cost_gbp === "string" ? Number(entry.estimated_cost_gbp) : entry.estimated_cost_gbp ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-4xl border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold tracking-tight">Failed AI requests</h2>
            <div className="mt-4 space-y-3">
              {data.failedAiRequests.length === 0 ? (
                <p className="text-sm text-slate-500">No failed AI requests yet.</p>
              ) : (
                data.failedAiRequests.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-amber-950">{entry.action_type}</p>
                      <p className="text-xs text-amber-900/70">{formatDateTime(entry.created_at)}</p>
                    </div>
                    <p className="mt-2 text-xs text-amber-900/80">User: {entry.user_id}</p>
                    <p className="mt-2 text-sm text-amber-950">{entry.error_message ?? entry.blocked_reason ?? "Unknown failure"}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
