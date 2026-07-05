export const FREE_GENERATION_LIMIT = 999;
export const PAID_ACCESS_DAYS = 31;
export const PAYWALL_PRICE_PENCE = 999;
export const PAYWALL_CURRENCY = "gbp";
export const PAYWALL_PRICE_LABEL = "£9.99";

export type UserEntitlementRecord = {
  user_id: string;
  free_generations_used: number;
  paid_access_until: string | null;
  stripe_customer_id: string | null;
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

export type BillingCheckoutActionState = {
  status: "idle" | "error";
  message: string;
};