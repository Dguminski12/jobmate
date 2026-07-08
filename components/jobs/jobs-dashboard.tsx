"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import JobModal from "./job-modal";
import DeleteJobModal from "./delete-job-modal";
import { jobStatuses, type DashboardFilters, type JobRecord } from "@/lib/jobs/types";

type ModalState =
  | { kind: "create" }
  | { kind: "edit"; job: JobRecord }
  | { kind: "delete"; job: JobRecord }
  | null;

type JobsDashboardProps = {
  jobs: JobRecord[];
  filters: DashboardFilters;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusTone(status: JobRecord["status"]) {
  switch (status) {
    case "Accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Offer":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Interview":
    case "Assessment":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function JobsDashboard({ jobs, filters }: JobsDashboardProps) {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [expandedNextActions, setExpandedNextActions] = useState<Record<string, boolean>>({});

  function toggleNotes(jobId: string) {
    setExpandedNotes((previous) => ({
      ...previous,
      [jobId]: !previous[jobId],
    }));
  }

  function toggleNextAction(jobId: string) {
    setExpandedNextActions((previous) => ({
      ...previous,
      [jobId]: !previous[jobId],
    }));
  }

  const counts = useMemo(() => {
    const next = {
      total: jobs.length,
      active: jobs.filter((job) => ["Wishlist", "Applied", "Interview", "Assessment"].includes(job.status)).length,
      offers: jobs.filter((job) => ["Offer", "Accepted"].includes(job.status)).length,
      needsAction: jobs.filter((job) => job.next_action && job.next_action.trim().length > 0).length,
    };

    return next;
  }, [jobs]);

  const isFiltered = filters.search.length > 0 || filters.status !== "all" || filters.sort !== "date-desc";

  return (
    <>
      <section className="grid gap-5 md:grid-cols-4">
        <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="text-sm font-semibold text-slate-950">Total jobs</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{counts.total}</div>
        </div>
        <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="text-sm font-semibold text-slate-950">Active pipeline</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{counts.active}</div>
        </div>
        <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="text-sm font-semibold text-slate-950">Offers / accepted</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{counts.offers}</div>
        </div>
        <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="text-sm font-semibold text-slate-950">Next actions</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{counts.needsAction}</div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-6">
        <form method="get" className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_auto]">
          <label className="block">
            <span className="sr-only">Search jobs</span>
            <input
              type="search"
              name="search"
              defaultValue={filters.search}
              placeholder="Search company, title, location, notes..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </label>

          <label className="block">
            <span className="sr-only">Filter by status</span>
            <select
              name="status"
              defaultValue={filters.status}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400"
            >
              <option value="all">All statuses</option>
              {jobStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Sort jobs</span>
            <select
              name="sort"
              defaultValue={filters.sort}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400"
            >
              <option value="date-desc">Newest application</option>
              <option value="date-asc">Oldest application</option>
              <option value="company-asc">Company A-Z</option>
              <option value="company-desc">Company Z-A</option>
            </select>
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Apply
            </button>
            <Link
              href="/dashboard/tracker"
              className="flex-1 rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Job tracker</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {isFiltered ? `${jobs.length} matching job${jobs.length === 1 ? "" : "s"}` : "Your active applications"}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setModalState({ kind: "create" })}
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add job
        </button>
      </section>

      {jobs.length === 0 ? (
        <section className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            {isFiltered ? "No jobs match these filters." : "No jobs yet."}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
            {isFiltered
              ? "Try a broader search or remove the selected filters to see more results."
              : "Create your first job entry to start tracking applications, statuses, and next actions in one place."}
          </p>
          <button
            type="button"
            onClick={() => setModalState({ kind: "create" })}
            className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add your first job
          </button>
        </section>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:block">
            <table className="min-w-[1700px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    "Company",
                    "Job title",
                    "Location",
                    "Salary",
                    "Employment type",
                    "Application date",
                    "Status",
                    "Job URL",
                    "Notes",
                    "Next action",
                    "Created at",
                    "Updated at",
                    "Actions",
                  ].map((header) => (
                    <th key={header} className="px-4 py-4 font-semibold whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-slate-100 align-top text-slate-700">
                    <td className="px-4 py-4 font-semibold text-slate-950 whitespace-nowrap">{job.company}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{job.job_title}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{job.location}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{job.salary ?? "Not set"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{job.employment_type}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(job.application_date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {job.job_url ? (
                        <a href={job.job_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-950 underline underline-offset-4">
                          Open
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </td>
                    <td className="max-w-[280px] px-4 py-4 align-top">
                      {job.notes ? (
                        <div>
                          <p className="whitespace-pre-wrap break-words">
                            {expandedNotes[job.id] ? job.notes : job.notes.slice(0, 140)}
                            {!expandedNotes[job.id] && job.notes.length > 140 ? "..." : ""}
                          </p>
                          {job.notes.length > 140 ? (
                            <button
                              type="button"
                              onClick={() => toggleNotes(job.id)}
                              className="mt-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                              {expandedNotes[job.id] ? "Collapse" : "Expand"}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        "Not set"
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-4 align-top">
                      {job.next_action ? (
                        <div>
                          <p className="whitespace-pre-wrap break-words">
                            {expandedNextActions[job.id] ? job.next_action : job.next_action.slice(0, 120)}
                            {!expandedNextActions[job.id] && job.next_action.length > 120 ? "..." : ""}
                          </p>
                          {job.next_action.length > 120 ? (
                            <button
                              type="button"
                              onClick={() => toggleNextAction(job.id)}
                              className="mt-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                              {expandedNextActions[job.id] ? "Collapse" : "Expand"}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        "Not set"
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDateTime(job.created_at)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDateTime(job.updated_at)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setModalState({ kind: "edit", job })}
                          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalState({ kind: "delete", job })}
                          className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 lg:hidden">
            {jobs.map((job) => (
              <article key={job.id} className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{job.company}</p>
                    <p className="mt-1 text-sm text-slate-600">{job.job_title}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-950">Location:</span> {job.location}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-950">Salary:</span> {job.salary ?? "Not set"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-950">Type:</span> {job.employment_type}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-950">Applied:</span> {formatDate(job.application_date)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-950">Next action:</span> {job.next_action ?? "Not set"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ kind: "edit", job })}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalState({ kind: "delete", job })}
                    className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {modalState?.kind === "create" ? <JobModal mode="create" onClose={() => setModalState(null)} /> : null}
      {modalState?.kind === "edit" ? <JobModal mode="edit" job={modalState.job} onClose={() => setModalState(null)} /> : null}
      {modalState?.kind === "delete" ? (
        <DeleteJobModal job={modalState.job} onClose={() => setModalState(null)} />
      ) : null}
    </>
  );
}
