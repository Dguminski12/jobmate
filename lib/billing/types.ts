export const FREE_GENERATION_LIMIT = 999;
export const PAID_ACCESS_DAYS = 31;
export const PAYWALL_PRICE_PENCE = 999;
export const PAYWALL_CURRENCY = "gbp";
export const PAYWALL_PRICE_LABEL = "GBP 9.99";
export const GENERATION_COOLDOWN_SECONDS = 10;
export const GENERATION_LOCK_SECONDS = 45;

export type GenerationReservationReason =
  | "granted"
  | "paywall_blocked"
  | "generation_in_progress"
  | "cooldown_active"
  | "unauthorized";

export type UserEntitlementRecord = {
  user_id: string;
  free_generations_used: number;
  paid_access_until: string | null;
  stripe_customer_id: string | null;
  last_generation_at: string | null;
  generation_lock_until: string | null;
  created_at: string;
  updated_at: string;
};

export type BillingAccessSummary = {
  freeGenerationsUsed: number;
  freeGenerationsRemaining: number;
  paidAccessUntil: string | null;
  hasActiveAccess: boolean;
};

export type GenerationAccessResult = BillingAccessSummary & {
  allowed: boolean;
};

export type GenerationReservationResult = BillingAccessSummary & {
  allowed: boolean;
  reason: GenerationReservationReason;
  reservedFreeGeneration: boolean;
  retryAfterSeconds: number;
};

export type BillingCheckoutActionState = {
  status: "idle" | "error";
  message: string;
};
