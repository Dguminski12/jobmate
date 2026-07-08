import {
  FREE_GENERATION_LIMIT,
  PAYWALL_PRICE_LABEL,
  type BillingAccessSummary,
  type GenerationReservationReason,
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

function formatRetryAfterSeconds(seconds: number) {
  if (seconds <= 1) {
    return "a moment";
  }

  if (seconds < 60) {
    return `${seconds} seconds`;
  }

  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

export function getGenerationReservationBlockedMessage(reason: GenerationReservationReason, retryAfterSeconds: number) {
  if (reason === "generation_in_progress") {
    return `A generation is already running on your account. Wait ${formatRetryAfterSeconds(retryAfterSeconds)} and try again.`;
  }

  if (reason === "cooldown_active") {
    return `Please wait ${formatRetryAfterSeconds(retryAfterSeconds)} before starting another generation.`;
  }

  if (reason === "unauthorized") {
    return "You are not authorized to generate content for this account.";
  }

  return getPaywallBlockedMessage();
}
