"use client";

import { useState } from "react";

const consentStorageKey = "jobmate-cookie-consent";

export default function CookieNotice() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const storedChoice = window.localStorage.getItem(consentStorageKey);
      return !storedChoice;
    } catch {
      return true;
    }
  });

  function persistChoice(choice: "accepted" | "rejected") {
    try {
      window.localStorage.setItem(consentStorageKey, choice);
    } catch {
      // Ignore storage failures and simply dismiss the notice.
    }

    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-3xl rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Cookies and local storage</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        JobMate uses essential cookies and local storage to keep you signed in and to preserve session preferences.
        Optional analytics or diagnostics may be added later, but they will not load unless you accept non-essential
        storage.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => persistChoice("accepted")}
          className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => persistChoice("rejected")}
          className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Reject non-essential
        </button>
      </div>
    </div>
  );
}
