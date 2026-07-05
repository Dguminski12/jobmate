import Link from "next/link";
import SiteBrand from "@/components/brand/site-brand";
import ThemeToggle from "@/components/theme/theme-toggle";

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_42%,#f7fbff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.6),transparent_32%),radial-gradient(circle_at_top_right,rgba(30,41,59,0.42),transparent_30%),linear-gradient(180deg,#020617_0%,#01030a_42%,#01030a_100%)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_42%,#f7fbff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.6),transparent_32%),radial-gradient(circle_at_top_right,rgba(30,41,59,0.42),transparent_30%),linear-gradient(180deg,#020617_0%,#01030a_42%,#01030a_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-128 bg-[linear-gradient(135deg,rgba(15,23,42,0.06),rgba(15,23,42,0))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.34),rgba(15,23,42,0))]" />

      <header className="sticky top-0 z-50 mx-auto flex w-full max-w-7xl items-center justify-between rounded-4xl border border-slate-200/80 bg-white/90 px-6 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:px-10 dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-[0_18px_50px_rgba(2,6,23,0.4)]">
        <SiteBrand />

        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex dark:text-slate-400">
          <a className="transition hover:text-slate-950" href="#features">
            Features
          </a>
          <a className="transition hover:text-slate-950" href="#workflow">
            Workflow
          </a>
          <a className="transition hover:text-slate-950" href="#security">
            Security
          </a>
        </nav>

        <div className="relative z-50 flex items-center gap-3 text-sm font-medium">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="landing-register-button rounded-full bg-slate-950 px-4 py-2 text-white shadow-[0_18px_50px_rgba(15,23,42,0.22)] transition hover:bg-slate-800"
          >
            Register
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:pb-28 lg:pt-14">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Built for faster applications, sharper interviews, stronger answers.
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl lg:text-7xl">
            AI Job & Interview Coach for people who want to move faster.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
            Upload your CV, drop in job descriptions from text or images, and JobMate will
            generate a tailored cover letter, interview questions, STAR answers, and
            confidence-building prep in seconds.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_22px_60px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start free
            </Link>
            <Link
              href="#workflow"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/75 px-6 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur transition hover:border-slate-400 hover:text-slate-950"
            >
              See the workflow
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="text-3xl font-semibold text-slate-950">12x</div>
              <div className="mt-1 text-sm text-slate-500">Faster first drafts</div>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="text-3xl font-semibold text-slate-950">1 upload</div>
              <div className="mt-1 text-sm text-slate-500">CV and job spec ingestion</div>
            </div>
            <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="text-3xl font-semibold text-slate-950">3 outputs</div>
              <div className="mt-1 text-sm text-slate-500">Letter, questions, STAR prep</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -right-6 bottom-8 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative rounded-4xl border border-white/80 bg-white/85 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-sm font-semibold text-slate-950">Ready to apply</div>
                <div className="text-sm text-slate-500">Upload CV + job description</div>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                AI active
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl bg-slate-950 p-5 text-slate-50 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Cover letter draft
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  I am excited to apply for the role. My experience in project delivery,
                  stakeholder management, and high-pressure problem solving aligns closely
                  with your requirements...
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Interview questions
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    <li>• Tell us about a time you led change.</li>
                    <li>• How do you prioritise under pressure?</li>
                    <li>• What makes you a fit for this team?</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    STAR examples
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Situation, Task, Action, Result answers tailored to the role and your CV.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Confidence score</span>
                  <span className="font-semibold text-slate-950">92%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[92%] rounded-full bg-linear-to-r from-emerald-500 via-cyan-500 to-blue-600" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/login"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            What it does
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Everything you need to turn one application into a complete interview pack.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="text-sm font-semibold text-slate-950">CV-aware generation</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Use your existing CV so the AI keeps your tone, experience, and achievements
              consistent across every output.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="text-sm font-semibold text-slate-950">Text and image input</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Paste a job post or upload screenshots and photos of the role description.
              JobMate extracts the useful parts automatically.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="text-sm font-semibold text-slate-950">Interview prep engine</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Generate likely questions, polished STAR examples, and role-specific talking
              points that help you sound ready on the day.
            </p>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="grid gap-6 rounded-4xl border border-white/80 bg-slate-950 p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built to get from job post to interview-ready in minutes.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              The experience is designed to feel focused and calm: upload, review, refine,
              and go.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">1. Upload</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Add your CV and job description from text, screenshots, or photos.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">2. Generate</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                JobMate produces a tailored cover letter and interview prep pack.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white">3. Refine</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Edit, compare, and polish until everything sounds like you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 lg:pb-32">
        <div className="flex flex-col items-start justify-between gap-6 rounded-4xl border border-slate-200 bg-white/85 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Ready for launch
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Log in or register to start building your next application pack.
            </h2>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
