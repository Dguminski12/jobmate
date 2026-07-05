import Link from "next/link";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/register-form";
import ThemeToggle from "@/components/theme/theme-toggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef5ff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="flex flex-col justify-center">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                JM
              </span>
              <span className="text-sm font-semibold tracking-[0.28em] text-slate-500 uppercase">
                JobMate
              </span>
            </Link>

            <h1 className="mt-8 max-w-xl text-5xl font-semibold tracking-tight md:text-6xl">
              Create your account and start building better applications.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              One workspace for CV uploads, job descriptions, and AI-generated interview prep.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                Cover letters
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                Question sets
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                STAR answers
              </span>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Get started
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Register your account
              </h2>
            </div>

            <RegisterForm />

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-950 underline underline-offset-4">
                Log in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}