import Link from "next/link";
import { redirect } from "next/navigation";
import SiteBrand from "@/components/brand/site-brand";
import LoginForm from "@/components/auth/login-form";
import ThemeToggle from "@/components/theme/theme-toggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="flex flex-col justify-center">
            <SiteBrand href="/" showSubtitle={false} />

            <h1 className="mt-8 max-w-xl text-5xl font-semibold tracking-tight md:text-6xl">
              Log in and pick up your next application from where you left off.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Access saved CVs, interview packs, and cover letter drafts in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                Fast drafts
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                Interview prep
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                STAR examples
              </span>
            </div>
          </section>

          <section className="rounded-4xl border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Welcome back
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Log in to continue
              </h2>
            </div>

            <LoginForm />

            <p className="mt-6 text-center text-sm text-slate-500">
              New here?{" "}
              <Link href="/register" className="font-semibold text-slate-950 underline underline-offset-4">
                Register
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}