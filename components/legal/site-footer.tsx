import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/85 px-6 py-6 text-sm text-slate-600 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>JobMate helps job seekers prepare applications and interviews with AI-assisted drafting.</p>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="transition hover:text-slate-950 dark:hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-slate-950 dark:hover:text-white">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
