import SiteBrand from "@/components/brand/site-brand";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto w-full max-w-4xl rounded-4xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <SiteBrand href="/" showSubtitle={false} />
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Terms of Use</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Rules for using JobMate</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          These terms explain the basic rules for using JobMate. By using the app, you agree to these terms.
        </p>

        <section className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">1. Service access</h2>
            <p className="mt-2">
              JobMate may offer a 31-day paid access window and a free or limited trial mode. Paid access is intended
              for personal use, subject to fair-use limits designed to prevent abuse and protect service availability.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">2. Personal use only</h2>
            <p className="mt-2">
              You must not share your account with others, resell access, or use scripts, bots or automated workflows
              to abuse the generation features. JobMate may suspend or restrict accounts that breach fair-use or abuse
              rules.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">3. AI output limitations</h2>
            <p className="mt-2">
              AI-generated application drafts, interview answers and research may contain mistakes, omissions or
              outdated information. You are responsible for checking all generated content before you use it in a real
              application or interview.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">4. No guarantees</h2>
            <p className="mt-2">
              JobMate does not guarantee interviews, job offers, improved hiring outcomes or employment. The service is
              a drafting and preparation tool only.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">5. Abuse and suspension</h2>
            <p className="mt-2">
              JobMate may suspend, throttle or terminate access if it detects automated/scripted abuse, account sharing,
              suspicious usage or activity that threatens the platform, its users or its costs.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">6. Refunds</h2>
            <p className="mt-2">
              Payments for JobMate access are non-refundable except where a refund is required under applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">7. Contact</h2>
            {/* TODO: Replace the placeholder support email before public launch. */}
            <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              TODO: Replace `support@yourdomain.com` with your real support contact before launch.
            </p>
            <p className="mt-2">Questions about these terms can be sent to `support@yourdomain.com`.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">8. Governing law</h2>
            <p className="mt-2">
              These terms are governed by the laws of England and Wales, unless mandatory local consumer law requires
              otherwise.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
