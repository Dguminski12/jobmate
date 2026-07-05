import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import SiteBrand from "@/components/brand/site-brand";
import SignOutButton from "@/components/auth/sign-out-button";
import ThemeToggle from "@/components/theme/theme-toggle";
import DashboardNavigation from "@/components/dashboard/dashboard-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "there";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] px-4 py-6 text-slate-950 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-4xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <SiteBrand href="/" showSubtitle={false} />
              <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">Welcome back, {displayName}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Keep pack generation and job tracking in separate workspaces, then switch instantly from the menu.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>

          <div className="mt-6">
            <DashboardNavigation />
          </div>
        </header>

        <section className="mt-8">{children}</section>
      </div>
    </main>
  );
}
