import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

type GrantPaidAccessInput = {
  userId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  amountPence: number;
  currency: string;
};

type GrantPaidAccessRpcRow = {
  applied: boolean;
  access_starts_at: string | null;
  access_ends_at: string | null;
  reason: string;
};

export async function grantPaidAccess(input: GrantPaidAccessInput) {
  const supabase = createSupabaseAdminClient();

  const rpcResponse = (await supabase.rpc("grant_paid_access_if_eligible", {
    p_user_id: input.userId,
    p_stripe_checkout_session_id: input.stripeCheckoutSessionId,
    p_stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    p_amount_pence: input.amountPence,
    p_currency: input.currency,
    p_stripe_customer_id: input.stripeCustomerId ?? null,
  })) as PostgrestSingleResponse<GrantPaidAccessRpcRow[]>;

  if (rpcResponse.error) {
    throw new Error(rpcResponse.error.message);
  }

  const result = rpcResponse.data?.[0];

  if (!result) {
    throw new Error("Billing grant RPC returned no result.");
  }

  if (!result.applied) {
    return {
      accessStartsAt: null,
      accessEndsAt: null,
    };
  }

  return {
    accessStartsAt: result.access_starts_at,
    accessEndsAt: result.access_ends_at,
  };
}