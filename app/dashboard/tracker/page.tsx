import JobsDashboard from "@/components/jobs/jobs-dashboard";
import { getJobs } from "@/lib/jobs/server";
import type { JobRecord } from "@/lib/jobs/types";
import { dashboardFiltersSchema } from "@/lib/jobs/validation";

type DashboardSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardTrackerPage({
  searchParams,
}: {
  searchParams?: DashboardSearchParams | Promise<DashboardSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = dashboardFiltersSchema.parse({
    search: firstValue(resolvedSearchParams.search) ?? "",
    status: firstValue(resolvedSearchParams.status) ?? "all",
    sort: firstValue(resolvedSearchParams.sort) ?? "date-desc",
  });

  let jobs: JobRecord[] = [];
  let jobsTableMissing = false;

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

  return jobsTableMissing ? (
    <div className="rounded-4xl border border-amber-200 bg-amber-50/90 p-6 shadow-[0_18px_50px_rgba(146,64,14,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Database setup required</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-amber-950">The jobs table has not been created in Supabase yet.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-amber-900/80">
        Run the SQL in <strong>supabase/schema.sql</strong>, then run <strong>supabase/migrations/20260704_create_jobs.sql</strong> in your Supabase SQL editor.
        Once complete, refresh this page and your job tracker will load normally.
      </p>
    </div>
  ) : (
    <JobsDashboard jobs={jobs} filters={filters} />
  );
}
