"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteJobAction } from "@/app/dashboard/actions";
import type { JobRecord } from "@/lib/jobs/types";
import type { JobDeleteActionState } from "@/lib/jobs/types";

const initialState: JobDeleteActionState = {
  status: "idle",
  message: "",
};

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
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

export default function DeleteJobModal({ job, onClose }: { job: JobRecord; onClose: () => void; }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(deleteJobAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onClose();
    }
  }, [onClose, router, state.status]);

  return (
    <ModalShell title="Delete job" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={job.id} />

        <p className="text-sm leading-7 text-slate-600">
          This will permanently remove <span className="font-semibold text-slate-950">{job.company}</span>
          {" "}
          <span className="font-semibold text-slate-950">{job.job_title}</span> from your tracker.
        </p>

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
            className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Deleting..." : "Delete job"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
