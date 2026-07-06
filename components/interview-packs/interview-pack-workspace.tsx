"use client";

import { useActionState, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  addInterviewPackToTrackerAction,
  createBillingCheckoutAction,
  deleteInterviewPackAction,
  generateInterviewPackAction,
  regenerateInterviewPackAction,
} from "@/app/dashboard/actions";
import {
  FREE_GENERATION_LIMIT,
  PAYWALL_PRICE_LABEL,
  type BillingAccessSummary,
  type BillingCheckoutActionState,
} from "@/lib/billing/types";
import type {
  AddPackToTrackerActionState,
  CVSource,
  DeleteInterviewPackActionState,
  GenerateInterviewPackActionState,
  InterviewPackContent,
  InterviewPackRecord,
  RegenerateInterviewPackActionState,
} from "@/lib/interview-packs/types";

const initialState: GenerateInterviewPackActionState = {
  status: "idle",
  message: "",
};

const addToTrackerInitialState: AddPackToTrackerActionState = {
  status: "idle",
  message: "",
};

const regeneratePackInitialState: RegenerateInterviewPackActionState = {
  status: "idle",
  message: "",
};

const deletePackInitialState: DeleteInterviewPackActionState = {
  status: "idle",
  message: "",
};

const billingCheckoutInitialState: BillingCheckoutActionState = {
  status: "idle",
  message: "",
};

const cvDraftStorageKey = "jobmate-cv-draft";

const stepLabels = ["Upload CV", "Add Job Details", "Additional Instructions", "Generate Interview Pack"];

type InterviewPackWorkspaceProps = {
  packs: InterviewPackRecord[];
  packsTableMissing: boolean;
  billingAccessSummary: BillingAccessSummary;
  billingStatusMessage: string;
  billingTableMissing: boolean;
};

type PersistedCvDraft = {
  mode: CVSource;
  fileName: string;
  text: string;
};

let cachedCvDraftRaw: string | null = null;
let cachedCvDraftValue: PersistedCvDraft | null = null;

function toStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeInterviewPackContent(value: unknown): InterviewPackContent {
  const input = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const atsKeywordAnalysis =
    typeof input.atsKeywordAnalysis === "object" && input.atsKeywordAnalysis !== null
      ? (input.atsKeywordAnalysis as Record<string, unknown>)
      : {};

  const starAnswerExamples = Array.isArray(input.starAnswerExamples)
    ? input.starAnswerExamples
        .map((item) => {
          const example = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};

          return {
            prompt: typeof example.prompt === "string" ? example.prompt : "",
            situation: typeof example.situation === "string" ? example.situation : "",
            task: typeof example.task === "string" ? example.task : "",
            action: typeof example.action === "string" ? example.action : "",
            result: typeof example.result === "string" ? example.result : "",
          };
        })
        .filter((item) => item.prompt || item.situation || item.task || item.action || item.result)
    : [];

  return {
    coverLetter: typeof input.coverLetter === "string" ? input.coverLetter : "No cover letter available.",
    cvOptimisationSuggestions: toStringList(input.cvOptimisationSuggestions),
    atsKeywordAnalysis: {
      summary:
        typeof atsKeywordAnalysis.summary === "string"
          ? atsKeywordAnalysis.summary
          : "ATS keyword analysis is unavailable for this pack.",
      matchedKeywords: toStringList(atsKeywordAnalysis.matchedKeywords),
      missingKeywords: toStringList(atsKeywordAnalysis.missingKeywords),
    },
    companyResearch: typeof input.companyResearch === "string" ? input.companyResearch : "No company research available.",
    roleSummary: typeof input.roleSummary === "string" ? input.roleSummary : "No role summary available.",
    likelyInterviewQuestions: toStringList(input.likelyInterviewQuestions),
    starAnswerExamples,
    technicalTopicsToRevise: toStringList(input.technicalTopicsToRevise),
    salaryInsights: typeof input.salaryInsights === "string" ? input.salaryInsights : "No salary insights available.",
    questionsToAskInterviewer: toStringList(input.questionsToAskInterviewer),
    interviewChecklist: toStringList(input.interviewChecklist),
    promptDrivenExtras: toStringList(input.promptDrivenExtras),
  };
}

function formatPackCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(createdAt));
}

function formatPaidAccessUntil(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getBillingStatusBannerClassName(message: string) {
  if (message.toLowerCase().includes("completed")) {
    return "mt-4 rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm";
  }

  if (message.toLowerCase().includes("cancelled")) {
    return "mt-4 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-950 shadow-sm";
  }

  return "mt-4 rounded-2xl border border-cyan-300 bg-white/80 px-4 py-3 text-sm font-semibold text-cyan-950 shadow-sm";
}

function getPersistedCvDraft(): PersistedCvDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(cvDraftStorageKey);
    if (!rawDraft) {
      cachedCvDraftRaw = null;
      cachedCvDraftValue = null;
      return null;
    }

    if (rawDraft === cachedCvDraftRaw) {
      return cachedCvDraftValue;
    }

    const parsedDraft = JSON.parse(rawDraft) as Partial<PersistedCvDraft>;
    if ((parsedDraft.mode !== "file" && parsedDraft.mode !== "text") || typeof parsedDraft.text !== "string") {
      cachedCvDraftRaw = rawDraft;
      cachedCvDraftValue = null;
      return null;
    }

    cachedCvDraftRaw = rawDraft;
    cachedCvDraftValue = {
      mode: parsedDraft.mode,
      fileName: typeof parsedDraft.fileName === "string" ? parsedDraft.fileName : "",
      text: parsedDraft.text,
    };

    return cachedCvDraftValue;
  } catch {
    cachedCvDraftRaw = null;
    cachedCvDraftValue = null;
    return null;
  }
}

function usePersistedCvDraft() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("jobmate-cv-draft", onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("jobmate-cv-draft", onStoreChange);
      };
    },
    getPersistedCvDraft,
    () => null,
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;

        return (
          <div
            key={label}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : isDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white/80 text-slate-600"
            }`}
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
              {isDone ? "✓" : stepNumber}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <div className="mt-3 text-sm leading-7 text-slate-700">{children}</div>
    </section>
  );
}

function InterviewPackView({
  pack,
  billingBlocked,
  regenerateAction,
  regenerateState,
  isRegenerating,
  deletePackAction,
  deletePackState,
  isDeletingPack,
}: {
  pack: InterviewPackRecord;
  billingBlocked: boolean;
  regenerateAction: (formData: FormData) => void;
  regenerateState: RegenerateInterviewPackActionState;
  isRegenerating: boolean;
  deletePackAction: (formData: FormData) => void;
  deletePackState: DeleteInterviewPackActionState;
  isDeletingPack: boolean;
}) {
  const [trackerState, trackerAction, isAddingToTracker] = useActionState(
    addInterviewPackToTrackerAction,
    addToTrackerInitialState,
  );
  const [additionalPrompt, setAdditionalPrompt] = useState(pack.additional_instructions ?? "");
  const content = normalizeInterviewPackContent(pack.ai_response);

  function handleRegenerateAction(formData: FormData) {
    setAdditionalPrompt("");
    regenerateAction(formData);
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Refine This Pack</h3>
            <p className="mt-2 text-sm text-slate-700">
              Add a follow-up prompt and regenerate this pack with more focused guidance.
            </p>
          </div>
          <form
            action={deletePackAction}
            onSubmit={(event) => {
              if (!window.confirm("Delete this interview pack? This cannot be undone.")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="packId" value={pack.id} />
            <button
              type="submit"
              disabled={isDeletingPack}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingPack ? "Deleting..." : "Delete pack"}
            </button>
          </form>
        </div>

        <form action={handleRegenerateAction} className="mt-4">
          <input type="hidden" name="packId" value={pack.id} />
          <textarea
            name="additionalPrompt"
            rows={4}
            value={additionalPrompt}
            onChange={(event) => setAdditionalPrompt(event.target.value)}
            placeholder="Example: Focus on leadership examples and keep outputs concise in UK English."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          />
          {regenerateState.fieldErrors?.additionalPrompt ? (
            <p className="mt-2 text-sm text-rose-600">{regenerateState.fieldErrors.additionalPrompt}</p>
          ) : null}

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isRegenerating || billingBlocked}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRegenerating ? "Regenerating..." : "Regenerate pack"}
            </button>
          </div>
        </form>

        {billingBlocked ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Free usage is exhausted. Unlock 31 days for {PAYWALL_PRICE_LABEL} to keep regenerating packs.
          </p>
        ) : null}

        {regenerateState.status === "success" ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {regenerateState.message}
          </p>
        ) : null}
        {regenerateState.status === "error" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {regenerateState.message}
          </p>
        ) : null}
        {deletePackState.status === "success" ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {deletePackState.message}
          </p>
        ) : null}
        {deletePackState.status === "error" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {deletePackState.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50/80 p-5 shadow-[0_18px_50px_rgba(6,78,99,0.08)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-cyan-950">Send This Pack to Job Tracker</h3>
            <p className="mt-2 text-sm text-cyan-900/80">
              Create a tracker entry from this pack with prefilled role details and prep notes.
            </p>
          </div>
          <form action={trackerAction}>
            <input type="hidden" name="packId" value={pack.id} />
            <button
              type="submit"
              disabled={isAddingToTracker}
              className="rounded-full bg-cyan-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAddingToTracker ? "Adding..." : "Add to Job Tracker"}
            </button>
          </form>
        </div>
        {trackerState.status === "success" ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {trackerState.message}
          </p>
        ) : null}
        {trackerState.status === "error" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {trackerState.message}
          </p>
        ) : null}
      </section>

      <SectionCard title="Cover Letter">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">{content.coverLetter}</pre>
      </SectionCard>
      <SectionCard title="CV Optimisation Suggestions">
        <ul className="list-disc space-y-1 pl-5">
          {content.cvOptimisationSuggestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="ATS Keyword Analysis">
        <p>{content.atsKeywordAnalysis.summary}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-emerald-700 uppercase">Matched Keywords</p>
            <p className="mt-2 text-sm">{content.atsKeywordAnalysis.matchedKeywords.join(", ")}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-amber-700 uppercase">Missing Keywords</p>
            <p className="mt-2 text-sm">{content.atsKeywordAnalysis.missingKeywords.join(", ")}</p>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Company Research">{content.companyResearch}</SectionCard>
      <SectionCard title="Role Summary">{content.roleSummary}</SectionCard>
      <SectionCard title="Likely Interview Questions">
        <ul className="list-disc space-y-1 pl-5">
          {content.likelyInterviewQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="STAR Answer Examples">
        <div className="space-y-3">
          {content.starAnswerExamples.map((example) => (
            <article key={example.prompt} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{example.prompt}</p>
              <p className="mt-2"><strong>Situation:</strong> {example.situation}</p>
              <p><strong>Task:</strong> {example.task}</p>
              <p><strong>Action:</strong> {example.action}</p>
              <p><strong>Result:</strong> {example.result}</p>
            </article>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Technical Topics to Revise">
        <ul className="list-disc space-y-1 pl-5">
          {content.technicalTopicsToRevise.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Salary Insights">{content.salaryInsights}</SectionCard>
      <SectionCard title="Questions to Ask the Interviewer">
        <ul className="list-disc space-y-1 pl-5">
          {content.questionsToAskInterviewer.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Interview Checklist">
        <ul className="list-disc space-y-1 pl-5">
          {content.interviewChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>
      {content.promptDrivenExtras.length > 0 ? (
        <SectionCard title="Prompt-Driven Extras">
          <ul className="list-disc space-y-1 pl-5">
            {content.promptDrivenExtras.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}

export default function InterviewPackWorkspace({
  packs,
  packsTableMissing,
  billingAccessSummary,
  billingStatusMessage,
  billingTableMissing,
}: InterviewPackWorkspaceProps) {
  const [state, formAction, isPending] = useActionState(generateInterviewPackAction, initialState);
  const [checkoutState, checkoutAction, isStartingCheckout] = useActionState(
    createBillingCheckoutAction,
    billingCheckoutInitialState,
  );
  const [regenerateState, regenerateAction, isRegenerating] = useActionState(
    regenerateInterviewPackAction,
    regeneratePackInitialState,
  );
  const [deletePackState, deletePackAction, isDeletingPack] = useActionState(
    deleteInterviewPackAction,
    deletePackInitialState,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [cvMode, setCvMode] = useState<"file" | "text">("file");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvText, setCvText] = useState<string | null>(null);
  const [screenshotNames, setScreenshotNames] = useState<string[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(packs[0]?.id ?? null);
  const [isPackHidden, setIsPackHidden] = useState(false);
  const persistedCvDraft = usePersistedCvDraft();
  const latestSavedCvDraft = state.status === "success" && state.pack
    ? {
        mode: state.pack.cv_source,
        fileName: state.pack.cv_file_name ?? "",
        text: state.pack.cv_text ?? "",
      }
    : packs[0]
      ? {
          mode: packs[0].cv_source,
          fileName: packs[0].cv_file_name ?? "",
          text: packs[0].cv_text ?? "",
        }
      : null;
  const activeCvDraft = persistedCvDraft ?? latestSavedCvDraft;

  const submittedCvMode = cvMode === "file" && !cvFileName && activeCvDraft ? activeCvDraft.mode : cvMode;
  const submittedCvText = cvText ?? activeCvDraft?.text ?? "";
  const submittedCvFileName = cvFileName ?? activeCvDraft?.fileName ?? "";
  const billingBlocked = !billingAccessSummary.hasActiveAccess && billingAccessSummary.freeGenerationsRemaining === 0;

  useEffect(() => {
    if (state.status !== "success" || !state.pack) {
      return;
    }

    const draft: PersistedCvDraft = {
      mode: state.pack.cv_source,
      fileName: state.pack.cv_file_name ?? "",
      text: state.pack.cv_text ?? "",
    };

    window.localStorage.setItem(cvDraftStorageKey, JSON.stringify(draft));
    window.dispatchEvent(new Event("jobmate-cv-draft"));
  }, [state]);

  const allPacks = useMemo(() => {
    let nextPacks = packs;

    if (state.status === "success" && state.pack) {
      nextPacks = [state.pack, ...nextPacks.filter((pack) => pack.id !== state.pack?.id)];
    }

    if (regenerateState.status === "success" && regenerateState.pack) {
      nextPacks = nextPacks.map((pack) => (pack.id === regenerateState.pack?.id ? regenerateState.pack : pack));
    }

    if (deletePackState.status === "success" && deletePackState.deletedPackId) {
      nextPacks = nextPacks.filter((pack) => pack.id !== deletePackState.deletedPackId);
    }

    return nextPacks;
  }, [packs, state, regenerateState, deletePackState]);

  const fallbackPack =
    allPacks[0] ??
    null;

  const latestActionPack =
    (regenerateState.status === "success" ? regenerateState.pack : null) ??
    (state.status === "success" ? state.pack : null) ??
    null;

  const resolvedSelectedPackId = selectedPackId && allPacks.some((pack) => pack.id === selectedPackId) ? selectedPackId : null;
  const selectedPack = latestActionPack
    ? latestActionPack
    : isPackHidden
      ? null
      : resolvedSelectedPackId
        ? allPacks.find((pack) => pack.id === resolvedSelectedPackId) ?? fallbackPack
        : fallbackPack;

  function handlePackSelection(packId: string) {
    if (selectedPackId === packId) {
      setIsPackHidden((previous) => !previous);
      return;
    }

    setSelectedPackId(packId);
    setIsPackHidden(false);
  }

  function nextStep() {
    setCurrentStep((previous) => Math.min(4, previous + 1));
  }

  function previousStep() {
    setCurrentStep((previous) => Math.max(1, previous - 1));
  }

  return (
    <section className="mt-8 space-y-6">
      <article className="rounded-4xl border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-slate-500 uppercase">Primary workflow</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Generate Interview Pack</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Upload your CV, add role details, include optional instructions, and generate an interview-ready pack with tailored content.
            </p>
          </div>
          {isPending ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-600" />
              Generating pack...
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <StepIndicator currentStep={currentStep} />
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-cyan-200 bg-cyan-50/80 p-5 shadow-[0_18px_50px_rgba(6,78,99,0.08)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-cyan-700 uppercase">Access</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-cyan-950">
                {billingAccessSummary.hasActiveAccess
                  ? `Unlimited access active until ${formatPaidAccessUntil(billingAccessSummary.paidAccessUntil ?? new Date().toISOString())}`
                  : `${billingAccessSummary.freeGenerationsRemaining} of ${FREE_GENERATION_LIMIT} free generations left`}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-cyan-950/80">
                Generations and regenerations both count toward the free allowance. After that, unlock 31 days of unlimited use for {PAYWALL_PRICE_LABEL}.
              </p>
            </div>

            {!billingAccessSummary.hasActiveAccess && !billingTableMissing ? (
              <form action={checkoutAction}>
                <button
                  type="submit"
                  disabled={isStartingCheckout}
                  className="rounded-full bg-cyan-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isStartingCheckout ? "Redirecting..." : `Unlock 31 Days for ${PAYWALL_PRICE_LABEL}`}
                </button>
              </form>
            ) : null}
          </div>

          {billingStatusMessage ? (
            <p className={getBillingStatusBannerClassName(billingStatusMessage)}>
              {billingStatusMessage}
            </p>
          ) : null}

          {checkoutState.status === "error" ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {checkoutState.message}
            </p>
          ) : null}
        </div>

        {packsTableMissing ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Interview Packs table is missing. Run the migration file for interview packs, then refresh the page.
          </div>
        ) : null}

        {billingTableMissing ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Billing tables are missing. Run the billing migration before testing the paywall.
          </div>
        ) : null}

        <form action={formAction} className="mt-6 space-y-6" noValidate>
          <input type="hidden" name="cvMode" value={submittedCvMode} />
          <input type="hidden" name="savedCvText" value={submittedCvText} />
          <input type="hidden" name="savedCvFileName" value={submittedCvFileName} />

          <div className={currentStep === 1 ? "space-y-4" : "hidden space-y-4"}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Pack title</span>
                <input
                  name="title"
                  placeholder="Senior Product Analyst - FinTech Interview Pack"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
                {state.fieldErrors?.title ? <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.title}</p> : null}
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCvMode("file")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    cvMode === "file" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="text-sm font-semibold">Upload CV File</p>
                  <p className="mt-1 text-xs opacity-80">PDF or DOCX supported. Parsing and OCR can be enhanced later.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCvMode("text")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    cvMode === "text" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="text-sm font-semibold">Paste CV Text</p>
                  <p className="mt-1 text-xs opacity-80">Paste raw CV content for direct AI analysis.</p>
                </button>
              </div>

              {cvMode === "file" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">CV file</span>
                  <input
                    type="file"
                    name="cvFile"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      setCvFileName(file?.name ?? null);
                    }}
                  />
                  {submittedCvFileName ? <p className="mt-2 text-xs text-slate-500">Selected: {submittedCvFileName}</p> : null}
                  {state.fieldErrors?.cvFile ? <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.cvFile}</p> : null}
                </label>
              ) : (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">CV text</span>
                  <textarea
                    name="cvText"
                    rows={8}
                    placeholder="Paste CV text..."
                    value={submittedCvText}
                    onChange={(event) => setCvText(event.currentTarget.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                  {state.fieldErrors?.cvText ? <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.cvText}</p> : null}
                </label>
              )}
          </div>

          <div className={currentStep === 2 ? "space-y-4" : "hidden space-y-4"}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Job URL (optional)</span>
                <input
                  type="url"
                  name="jobUrl"
                  placeholder="https://company.com/careers/role"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Job description text (optional)</span>
                <textarea
                  name="jobDescription"
                  rows={8}
                  placeholder="Paste job description here..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Upload job advert screenshots (optional)</span>
                <input
                  type="file"
                  name="jobScreenshots"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  onChange={(event) => {
                    const nextNames = Array.from(event.currentTarget.files ?? []).map((file) => file.name);
                    setScreenshotNames(nextNames);
                  }}
                />
                {screenshotNames.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">{screenshotNames.length} screenshot(s): {screenshotNames.join(", ")}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Screenshots are sent for AI-assisted OCR and context extraction.</p>
                )}
              </label>

              {state.fieldErrors?.jobDetails ? <p className="text-sm text-rose-600">{state.fieldErrors.jobDetails}</p> : null}
          </div>

          <div className={currentStep === 3 ? "space-y-4" : "hidden space-y-4"}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Additional AI instructions (optional)</span>
                <textarea
                  name="additionalInstructions"
                  rows={8}
                  placeholder="Example: Keep tone concise, prioritize product metrics examples, and include UK English spelling."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </label>
          </div>

          <div className={currentStep === 4 ? "rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700" : "hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"}>
              <p className="font-semibold text-slate-950">Ready to generate</p>
              <p className="mt-2">
                Submitting will create an Interview Pack with cover letter, CV suggestions, ATS keyword analysis, company research, role summary, interview questions, STAR examples, technical topics, salary insights, interviewer questions, and a checklist.
              </p>
              <p className="mt-3 text-xs text-slate-500">Generation runs through a single AI service boundary with fallback handling.</p>
          </div>

          {state.status === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p>{state.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.fieldErrors?.title || state.fieldErrors?.cvText || state.fieldErrors?.cvFile ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500"
                  >
                    Go to Step 1
                  </button>
                ) : null}
                {state.fieldErrors?.jobDetails ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-500"
                  >
                    Go to Step 2
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {state.status === "success" ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={previousStep}
                disabled={currentStep === 1 || isPending}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 4 || isPending}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>

            <button
              type="submit"
              disabled={isPending || packsTableMissing || billingTableMissing || billingBlocked || currentStep !== 4}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Generating..." : billingBlocked ? "Unlock Required" : "Generate Interview Pack"}
            </button>
          </div>
        </form>
      </article>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-4xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">Saved Interview Packs</h3>
              <p className="mt-2 text-sm text-slate-600">Revisit previous packs and continue preparing.</p>
            </div>
            {selectedPack ? (
              <button
                type="button"
                onClick={() => setIsPackHidden(true)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Hide
              </button>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {allPacks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No interview packs yet. Complete the wizard above to generate your first pack.
              </p>
            ) : (
              allPacks.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handlePackSelection(pack.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    resolvedSelectedPackId === pack.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  <p className="text-sm font-semibold">{pack.title}</p>
                  <p className={`mt-1 text-xs ${resolvedSelectedPackId === pack.id ? "text-slate-300" : "text-slate-500"}`}>
                    <time dateTime={pack.created_at} suppressHydrationWarning>
                      {formatPackCreatedAt(pack.created_at)}
                    </time>
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <div>
          {selectedPack ? (
            <InterviewPackView
              key={selectedPack.id}
              pack={selectedPack}
              billingBlocked={billingBlocked || billingTableMissing}
              regenerateAction={regenerateAction}
              regenerateState={regenerateState}
              isRegenerating={isRegenerating}
              deletePackAction={deletePackAction}
              deletePackState={deletePackState}
              isDeletingPack={isDeletingPack}
            />
          ) : (
            <div className="rounded-4xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-600">
              Select a pack to view generated content.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}