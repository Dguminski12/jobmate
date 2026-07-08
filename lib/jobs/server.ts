import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  dashboardFiltersSchema,
  deleteJobSchema,
  type DashboardFiltersInput,
  createJobSchema,
  updateJobSchema,
} from "./validation";
import type { JobRecord } from "./types";

type SortableJobsQuery = {
  order: (column: string, options: { ascending: boolean }) => SortableJobsQuery;
};

function buildSearchTerm(search: string) {
  return search.replace(/[%(),]/g, " ").trim();
}

export async function getAuthedClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

function sortJobsQuery(
  query: SortableJobsQuery,
  sort: DashboardFiltersInput["sort"],
) {
  switch (sort) {
    case "date-asc":
      return query.order("application_date", { ascending: true }).order("created_at", { ascending: true });
    case "company-asc":
      return query.order("company", { ascending: true }).order("created_at", { ascending: false });
    case "company-desc":
      return query.order("company", { ascending: false }).order("created_at", { ascending: false });
    case "date-desc":
    default:
      return query.order("application_date", { ascending: false }).order("created_at", { ascending: false });
  }
}

export async function getJobs(filtersInput: DashboardFiltersInput): Promise<JobRecord[]> {
  const filters = dashboardFiltersSchema.parse(filtersInput);
  const { supabase, user } = await getAuthedClient();

  let query = supabase.from("jobs").select("*").eq("user_id", user.id);

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search) {
    const searchTerm = buildSearchTerm(filters.search);
    if (searchTerm) {
      query = query.or(
        [
          `company.ilike.%${searchTerm}%`,
          `job_title.ilike.%${searchTerm}%`,
          `location.ilike.%${searchTerm}%`,
          `salary.ilike.%${searchTerm}%`,
          `notes.ilike.%${searchTerm}%`,
          `next_action.ilike.%${searchTerm}%`,
        ].join(","),
      );
    }
  }

  query = sortJobsQuery(query, filters.sort);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as JobRecord[];
}

export async function createJobForUser(input: unknown, userId: string) {
  const values = createJobSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("jobs").insert({
    user_id: userId,
    company: values.company,
    job_title: values.jobTitle,
    location: values.location,
    salary: values.salary ?? null,
    employment_type: values.employmentType,
    application_date: values.applicationDate,
    status: values.status,
    job_url: values.jobUrl ?? null,
    notes: values.notes ?? null,
    next_action: values.nextAction ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateJobForUser(input: unknown, userId: string) {
  const values = updateJobSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("jobs")
    .update({
      company: values.company,
      job_title: values.jobTitle,
      location: values.location,
      salary: values.salary ?? null,
      employment_type: values.employmentType,
      application_date: values.applicationDate,
      status: values.status,
      job_url: values.jobUrl ?? null,
      notes: values.notes ?? null,
      next_action: values.nextAction ?? null,
    })
    .eq("id", values.id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteJobForUser(input: unknown, userId: string) {
  const values = deleteJobSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("jobs").delete().eq("id", values.id).eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
