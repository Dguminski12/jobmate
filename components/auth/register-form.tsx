"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth";

type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

function parseFieldErrors(error: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  const nextErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      nextErrors[field as keyof RegisterFormValues] = issue.message;
    }
  }

  return nextErrors;
}

export default function RegisterForm() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const parsed = registerSchema.safeParse(values);

    if (!parsed.success) {
      setFormError(null);
      setSuccessMessage(null);
      setFieldErrors(parseFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.fullName,
          },
        },
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      if (data.session) {
        window.location.assign("/dashboard/packs");
        return;
      }

      setSuccessMessage("Account created. Check your inbox to confirm your email, then log in.");
    });
  }

  return (
    <form method="post" className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
        <input
          type="text"
          name="fullName"
          autoComplete="name"
          placeholder="Alex Morgan"
          aria-invalid={Boolean(fieldErrors.fullName)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
        {fieldErrors.fullName ? (
          <p className="mt-2 text-sm text-rose-600">{fieldErrors.fullName}</p>
        ) : null}
      </label>
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
        <div className="relative">
          <input
            type={isPasswordVisible ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(fieldErrors.password)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((previous) => !previous)}
            className="absolute inset-y-0 right-3 my-auto h-9 rounded-full px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            {isPasswordVisible ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="mt-2 text-sm text-rose-600">{fieldErrors.password}</p>
        ) : null}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
        <div className="relative">
          <input
            type={isConfirmPasswordVisible ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          />
          <button
            type="button"
            onClick={() => setIsConfirmPasswordVisible((previous) => !previous)}
            className="absolute inset-y-0 right-3 my-auto h-9 rounded-full px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            {isConfirmPasswordVisible ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.confirmPassword ? (
          <p className="mt-2 text-sm text-rose-600">{fieldErrors.confirmPassword}</p>
        ) : null}
      </label>

      {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
