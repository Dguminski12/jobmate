"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const navItems = [
  {
    href: "/dashboard/packs",
    title: "Interview Packs",
    description: "Generate and review prep packs",
  },
  {
    href: "/dashboard/tracker",
    title: "Job Tracker",
    description: "Manage applications and follow-ups",
  },
] as const;

function itemClasses(active: boolean) {
  if (active) {
    return "border-slate-900 bg-slate-900 text-white";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950";
}

function itemDescriptionClasses(active: boolean) {
  return active ? "text-slate-300" : "text-slate-500";
}

export default function DashboardNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTitle = useMemo(() => {
    const currentItem = navItems.find((item) => pathname.startsWith(item.href));
    return currentItem?.title ?? "Dashboard";
  }, [pathname]);

  return (
    <>
      <nav className="hidden grid-cols-2 gap-3 md:grid">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl border px-4 py-3 transition ${itemClasses(active)}`}
            >
              <p className="text-sm font-semibold">{item.title}</p>
              <p className={`mt-1 text-xs ${itemDescriptionClasses(active)}`}>{item.description}</p>
            </Link>
          );
        })}
      </nav>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="inline-flex items-center gap-3 rounded-full border border-cyan-100/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
        >
          <span className="text-[11px] font-semibold tracking-[0.08em] text-slate-900 uppercase dark:rounded-full dark:bg-slate-900 dark:px-2.5 dark:py-1 dark:text-white">Menu</span>
          {activeTitle}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <button
            type="button"
            className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.7),rgba(30,41,59,0.55))] backdrop-blur-[2px] dark:bg-[linear-gradient(120deg,rgba(2,6,23,0.84),rgba(15,23,42,0.76))]"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <aside className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/75 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.95)_100%)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.96)_100%)] dark:shadow-[0_28px_90px_rgba(2,6,23,0.65)]">
              <div className="pointer-events-none absolute -top-10 -left-8 h-28 w-28 rounded-full bg-cyan-300/35 blur-2xl dark:bg-cyan-500/20" />
              <div className="pointer-events-none absolute -bottom-8 right-0 h-24 w-24 rounded-full bg-blue-200/35 blur-2xl dark:bg-blue-500/20" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">Dashboard menu</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Switch between workspaces</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-slate-300 bg-white/75 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-500 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="relative mt-6 space-y-2">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-2xl border px-4 py-3 shadow-sm transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white dark:border-cyan-400/50 dark:bg-slate-950"
                          : "border-slate-200/90 bg-white/75 text-slate-700 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-400/45 dark:hover:bg-slate-900"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className={`mt-1 text-xs ${itemDescriptionClasses(active)}`}>{item.description}</p>
                    </Link>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
