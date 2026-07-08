import {
  FREE_GENERATION_LIMIT,
  PAYWALL_PRICE_LABEL,
  type BillingAccessSummary,
  type UserEntitlementRecord,
} from "./types";

type BillingSummaryRecord = Pick<UserEntitlementRecord, "free_generations_used" | "paid_access_until">;

export function toBillingAccessSummary(record: BillingSummaryRecord): BillingAccessSummary {
  const paidAccessUntil = record.paid_access_until;
  const hasActiveAccess = Boolean(paidAccessUntil && new Date(paidAccessUntil).getTime() > Date.now());

  return {
    freeGenerationsUsed: record.free_generations_used,
    freeGenerationsRemaining: Math.max(0, FREE_GENERATION_LIMIT - record.free_generations_used),
    paidAccessUntil,
    hasActiveAccess,
  };
}

export function hasGenerationAccess(summary: BillingAccessSummary) {
  return summary.hasActiveAccess || summary.freeGenerationsRemaining > 0;
}

export function getPaywallBlockedMessage() {
  return `Your ${FREE_GENERATION_LIMIT} free generations are used up. Unlock 31 days of unlimited generations and regenerations for ${PAYWALL_PRICE_LABEL}.`;
}
