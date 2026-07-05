"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJobAction, updateJobAction } from "@/app/dashboard/actions";
import { employmentTypes, jobStatuses, type JobRecord } from "@/lib/jobs/types";
import type { JobActionState } from "@/lib/jobs/types";

const initialState: JobActionState = {
  status: "idle",
  message: "",
};

type JobModalProps = {
  mode: "create" | "edit";
  job?: JobRecord | null;
  onClose: () => void;
};

function ModalShell({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
          >
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-600">{message}</p>;
}

export default function JobModal({ mode, job, onClose }: JobModalProps) {
  const router = useRouter();
  const action = mode === "create" ? createJobAction : updateJobAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onClose();
    }
  }, [onClose, router, state.status]);

  return (
    <ModalShell
      title={mode === "create" ? "Create job" : "Edit job"}
      subtitle={mode === "create" ? "Add a job to your tracker." : "Update the details you have saved for this role."}
      onClose={onClose}
    >
      <form className="space-y-6" action={formAction} noValidate>
        {mode === "edit" ? <input type="hidden" name="id" value={job?.id ?? ""} /> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Company</span>
            <input
              name="company"
              defaultValue={job?.company ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Acme Ltd"
            />
            <FieldError message={state.fieldErrors?.company} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Job title</span>
            <input
              name="jobTitle"
              defaultValue={job?.job_title ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Senior Product Manager"
            />
            <FieldError message={state.fieldErrors?.jobTitle} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
            <input
              name="location"
              defaultValue={job?.location ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="London, UK"
            />
            <FieldError message={state.fieldErrors?.location} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Salary</span>
            <input
              name="salary"
              defaultValue={job?.salary ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="£60,000 - £75,000"
            />
            <FieldError message={state.fieldErrors?.salary} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Employment type</span>
            <select
              name="employmentType"
              defaultValue={job?.employment_type ?? "Full-time"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400"
            >
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.employmentType} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Application date</span>
            <input
              type="date"
              name="applicationDate"
              defaultValue={job?.application_date ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400"
            />
            <FieldError message={state.fieldErrors?.applicationDate} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              defaultValue={job?.status ?? "Wishlist"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400"
            >
              {jobStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.status} />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Job URL</span>
            <input
              name="jobUrl"
              defaultValue={job?.job_url ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="https://company.com/jobs/..."
            />
            <FieldError message={state.fieldErrors?.jobUrl} />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
            <textarea
              name="notes"
              defaultValue={job?.notes ?? ""}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Anything worth remembering about this role."
            />
            <FieldError message={state.fieldErrors?.notes} />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Next action</span>
            <textarea
              name="nextAction"
              defaultValue={job?.next_action ?? ""}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Follow up next Thursday."
            />
            <FieldError message={state.fieldErrors?.nextAction} />
          </label>
        </div>

        {state.status === "error" ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create job" : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
