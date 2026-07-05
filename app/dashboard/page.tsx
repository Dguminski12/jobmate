import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import JobsDashboard from "@/components/jobs/jobs-dashboard";
import InterviewPackWorkspace from "@/components/interview-packs/interview-pack-workspace";
import { getJobs } from "@/lib/jobs/server";
import type { JobRecord } from "@/lib/jobs/types";
import type { InterviewPackRecord } from "@/lib/interview-packs/types";
import { dashboardFiltersSchema } from "@/lib/jobs/validation";
import { getInterviewPacksForUser } from "@/lib/interview-packs/server";

type DashboardSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: DashboardSearchParams | Promise<DashboardSearchParams>;
}) {
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

  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = dashboardFiltersSchema.parse({
    search: firstValue(resolvedSearchParams.search) ?? "",
    status: firstValue(resolvedSearchParams.status) ?? "all",
    sort: firstValue(resolvedSearchParams.sort) ?? "date-desc",
  });

  let jobs: JobRecord[] = [];
  let jobsTableMissing = false;
  let interviewPacks: InterviewPackRecord[] = [];
  let interviewPacksTableMissing = false;

  try {
    jobs = await getJobs(filters);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    jobsTableMissing =
      message.includes("public.jobs") ||
      message.includes("Could not find the table");

    if (!jobsTableMissing) {
      throw error;
    }
  }

  try {
    interviewPacks = await getInterviewPacksForUser(user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    interviewPacksTableMissing =
      message.includes("public.interview_packs") ||
      message.includes("Could not find the table");

    if (!interviewPacksTableMissing) {
      throw error;
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef5ff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                JM
              </span>
              <span className="text-sm font-semibold tracking-[0.28em] text-slate-500 uppercase">
                JobMate
              </span>
            </Link>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome back, {displayName}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Generate AI-powered interview packs from your CV and role details, then use the application tracker as a secondary workspace.
            </p>
          </div>

          <SignOutButton />
        </header>

        <InterviewPackWorkspace packs={interviewPacks} packsTableMissing={interviewPacksTableMissing} />

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold tracking-[0.26em] text-slate-500 uppercase">Secondary workflow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Application Tracker</h2>
          </div>

          {jobsTableMissing ? (
            <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 shadow-[0_18px_50px_rgba(146,64,14,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Database setup required</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-amber-950">The jobs table has not been created in Supabase yet.</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-amber-900/80">
                Run the SQL in <strong>supabase/schema.sql</strong>, then run <strong>supabase/migrations/20260704_create_jobs.sql</strong> in your Supabase SQL editor.
                Once complete, refresh this page and your job tracker will load normally.
              </p>
            </div>
          ) : (
            <JobsDashboard jobs={jobs} filters={filters} />
          )}
        </section>
      </div>
    </main>
  );
}