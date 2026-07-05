"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

function parseFieldErrors(error: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  const nextErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      nextErrors[field as keyof LoginFormValues] = issue.message;
    }
  }

  return nextErrors;
}

export default function LoginForm() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      setFormError(null);
      setFieldErrors(parseFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);

      if (error) {
        setFormError(error.message);
        return;
      }

      window.location.assign("/dashboard/packs");
    });
  }

  return (
    <form method="post" className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(fieldErrors.email)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
        {fieldErrors.email ? <p className="mt-2 text-sm text-rose-600">{fieldErrors.email}</p> : null}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={Boolean(fieldErrors.password)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
        {fieldErrors.password ? (
          <p className="mt-2 text-sm text-rose-600">{fieldErrors.password}</p>
        ) : null}
      </label>

      {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}