import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PAID_ACCESS_DAYS, type UserEntitlementRecord } from "./types";

type GrantPaidAccessInput = {
  userId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  amountPence: number;
  currency: string;
};

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

export async function grantPaidAccess(input: GrantPaidAccessInput) {
  const supabase = createSupabaseAdminClient();

  const { data: existingPurchase, error: purchaseLookupError } = await supabase
    .from("payment_purchases")
    .select("id")
    .eq("stripe_checkout_session_id", input.stripeCheckoutSessionId)
    .maybeSingle();

  if (purchaseLookupError) {
    throw new Error(purchaseLookupError.message);
  }

  if (existingPurchase) {
    return {
      accessStartsAt: null,
      accessEndsAt: null,
    };
  }

  const { data: existingEntitlement, error: entitlementError } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (entitlementError) {
    throw new Error(entitlementError.message);
  }

  const entitlement = existingEntitlement as UserEntitlementRecord | null;
  const now = new Date();
  const existingPaidAccessUntil = entitlement?.paid_access_until ? new Date(entitlement.paid_access_until) : null;
  const hasActiveAccess = Boolean(existingPaidAccessUntil && existingPaidAccessUntil > now);

  if (hasActiveAccess) {
    return {
      accessStartsAt: null,
      accessEndsAt: null,
    };
  }

  const accessStartsAt = now;
  const accessEndsAt = addDays(accessStartsAt, PAID_ACCESS_DAYS);

  const { error: upsertError } = await supabase.from("user_entitlements").upsert({
    user_id: input.userId,
    free_generations_used: entitlement?.free_generations_used ?? 0,
    paid_access_until: accessEndsAt.toISOString(),
    stripe_customer_id: input.stripeCustomerId ?? entitlement?.stripe_customer_id ?? null,
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { error: purchaseError } = await supabase.from("payment_purchases").insert({
    user_id: input.userId,
    stripe_checkout_session_id: input.stripeCheckoutSessionId,
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    amount_pence: input.amountPence,
    currency: input.currency,
    access_starts_at: accessStartsAt.toISOString(),
    access_ends_at: accessEndsAt.toISOString(),
  });

  if (purchaseError && !purchaseError.message.toLowerCase().includes("duplicate key")) {
    throw new Error(purchaseError.message);
  }

  return {
    accessStartsAt: accessStartsAt.toISOString(),
    accessEndsAt: accessEndsAt.toISOString(),
  };
}