import SiteBrand from "@/components/brand/site-brand";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto w-full max-w-4xl rounded-4xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <SiteBrand href="/" showSubtitle={false} />
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Privacy Policy</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">How JobMate handles your data</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This policy explains what information JobMate stores, why it is used, and the choices available to you.
          JobMate is a UK-focused AI job application app that helps users generate application and interview-prep
          materials. For the purposes of this policy, references to JobMate mean the JobMate service and business.
        </p>

        <section className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">1. Account data</h2>
            <p className="mt-2">
              When you create an account, JobMate stores basic account information such as your name, login email and
              account timestamps in Supabase so you can sign in securely and access your workspace.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">2. CVs, screenshots and job content</h2>
            <p className="mt-2">
              If you upload a CV, job advert screenshots or paste a job description, JobMate processes that material to
              generate interview packs and related AI outputs. Uploaded CV text, screenshots metadata, pasted job
              descriptions and generated AI documents may be stored in the database so you can revisit and refine your
              work.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">3. Generated AI documents</h2>
            <p className="mt-2">
              JobMate stores generated cover letters, interview notes, role summaries, STAR examples and related pack
              content so you can review and reuse them later. This content is associated with your account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">4. Storage and service providers</h2>
            <p className="mt-2">
              JobMate uses Supabase for authentication and database storage. JobMate also sends relevant job and CV
              content to OpenAI or a similar AI provider so the app can generate your requested documents. That means
              some personal and job-related text may be processed outside JobMate&apos;s own database during generation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">5. Cookies and local storage</h2>
            <p className="mt-2">
              JobMate uses essential cookies and local storage for login sessions, theme preferences, draft persistence
              and similar core features. Optional analytics or diagnostics may be introduced later and, if they are,
              the app will ask for appropriate consent before loading non-essential tooling.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">6. Payments</h2>
            <p className="mt-2">
              If paid access is enabled, JobMate shares limited billing data with Stripe so purchases can be processed
              and access windows can be granted. JobMate does not intend to store full card details directly on its own
              servers.
            </p>
            <p className="mt-2">
              Stripe may process payment-related data under its own privacy and security standards in order to complete
              transactions and support billing operations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">7. Your rights</h2>
            <p className="mt-2">
              Depending on where you live, you may have rights to access, correct, delete or export your personal data,
              and to object to certain processing. You can also request account deletion.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">8. Contact</h2>
            {/* TODO: Replace the placeholder support email before public launch. */}
            <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              TODO: Replace `support@yourdomain.com` with your real privacy contact email before launch.
            </p>
            <p className="mt-2">Privacy requests can be sent to `support@yourdomain.com`.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">9. Applicable law</h2>
            <p className="mt-2">
              This policy is intended to sit alongside the laws of England and Wales and any applicable UK data
              protection requirements.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
