import { getBillingAccessSummary } from "@/lib/billing/server";
import type { BillingAccessSummary } from "@/lib/billing/types";
import { getInterviewPacksForUser } from "@/lib/interview-packs/server";
import type { InterviewPackRecord } from "@/lib/interview-packs/types";
import { getAuthedClient } from "@/lib/jobs/server";
import InterviewPackWorkspace from "@/components/interview-packs/interview-pack-workspace";

type DashboardPacksPageProps = {
  searchParams?: Promise<{ billing?: string }>;
};

export default async function DashboardPacksPage({ searchParams }: DashboardPacksPageProps) {
  const { user } = await getAuthedClient();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  let interviewPacks: InterviewPackRecord[] = [];
  let interviewPacksTableMissing = false;
  let billingTableMissing = false;
  let billingStatusMessage = "";
  let billingAccessSummary: BillingAccessSummary = {
    freeGenerationsUsed: 0,
    freeGenerationsRemaining: 3,
    paidAccessUntil: null,
    hasActiveAccess: false,
  };

  try {
    interviewPacks = await getInterviewPacksForUser(user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    interviewPacksTableMissing =
      message.includes("public.interview_packs") ||
      message.includes("Could not find the table");

    if (!interviewPacksTableMissing) {
      throw error;
    }
  }

  try {
    billingAccessSummary = await getBillingAccessSummary(user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    billingTableMissing =
      message.includes("public.user_entitlements") ||
      message.includes("get_or_create_user_entitlement") ||
      message.includes("Could not find the table");

    if (!billingTableMissing) {
      throw error;
    }
  }

  if (resolvedSearchParams.billing === "success") {
    billingStatusMessage = "Stripe checkout completed. Your 31-day access will unlock as soon as the payment webhook confirms it.";
  }

  if (resolvedSearchParams.billing === "cancelled") {
    billingStatusMessage = "Checkout was cancelled. Your free generations remain available until the 3-use limit is reached.";
  }

  return (
    <InterviewPackWorkspace
      packs={interviewPacks}
      packsTableMissing={interviewPacksTableMissing}
      billingAccessSummary={billingAccessSummary}
      billingStatusMessage={billingStatusMessage}
      billingTableMissing={billingTableMissing}
    />
  );
}
