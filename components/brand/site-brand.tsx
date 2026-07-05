import Image from "next/image";
import Link from "next/link";

type SiteBrandProps = {
  href?: string;
  className?: string;
  showSubtitle?: boolean;
};

export default function SiteBrand({
  href = "/",
  className = "",
  showSubtitle = true,
}: SiteBrandProps) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-3 ${className}`.trim()}>
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900">
        <Image
          src="/logo.png"
          alt="JobMate logo"
          width={44}
          height={44}
          priority
          className="h-full w-full object-cover"
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-[0.28em] text-slate-500 uppercase dark:text-slate-400">
          JobMate
        </span>
        {showSubtitle ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">AI Job & Interview Coach</span>
        ) : null}
      </span>
    </Link>
  );
}