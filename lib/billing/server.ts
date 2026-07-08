import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  GENERATION_COOLDOWN_SECONDS,
  GENERATION_LOCK_SECONDS,
  FREE_GENERATION_LIMIT,
  type BillingAccessSummary,
  type GenerationAccessResult,
  type GenerationReservationResult,
  type UserEntitlementRecord,
} from "./types";
import { toBillingAccessSummary } from "./logic";

async function getOrCreateEntitlementRecord(userId: string): Promise<UserEntitlementRecord> {
  const supabase = await createSupabaseServerClient();

  const { data: existingRecord, error: selectError } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existingRecord) {
    return existingRecord as UserEntitlementRecord;
  }

  const { data: insertedRecord, error: insertError } = await supabase
    .from("user_entitlements")
    .insert({
      user_id: userId,
    })
    .select("*")
    .single();

  if (insertError) {
    const { data: retriedRecord, error: retryError } = await supabase
      .from("user_entitlements")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (retryError) {
      throw new Error(insertError.message);
    }

    return retriedRecord as UserEntitlementRecord;
  }

  return insertedRecord as UserEntitlementRecord;
}

export async function getBillingAccessSummary(userId: string): Promise<BillingAccessSummary> {
  const record = await getOrCreateEntitlementRecord(userId);

  return toBillingAccessSummary(record);
}

export async function consumeGenerationAccess(userId: string): Promise<GenerationAccessResult> {
  const supabase = await createSupabaseServerClient();
  const entitlement = await getOrCreateEntitlementRecord(userId);
  const accessSummary = toBillingAccessSummary(entitlement);

  if (accessSummary.hasActiveAccess) {
    return {
      ...accessSummary,
      allowed: true,
    };
  }

  if (entitlement.free_generations_used >= FREE_GENERATION_LIMIT) {
    return {
      ...accessSummary,
      allowed: false,
    };
  }

  const nextFreeGenerationCount = entitlement.free_generations_used + 1;
  const { data: updatedEntitlement, error: updateError } = await supabase
    .from("user_entitlements")
    .update({
      free_generations_used: nextFreeGenerationCount,
    })
    .eq("user_id", userId)
    .eq("free_generations_used", entitlement.free_generations_used)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  const updatedSummary = toBillingAccessSummary(updatedEntitlement as UserEntitlementRecord);

  return {
    ...updatedSummary,
    allowed: true,
  };
}

type ReserveGenerationAccessRpcRow = {
  allowed: boolean;
  reason: GenerationReservationResult["reason"];
  reserved_free_generation: boolean;
  retry_after_seconds: number;
  free_generations_used: number;
  paid_access_until: string | null;
};

export async function reserveGenerationAccess(userId: string): Promise<GenerationReservationResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("reserve_generation_access", {
    p_user_id: userId,
    p_free_generation_limit: FREE_GENERATION_LIMIT,
    p_cooldown_seconds: GENERATION_COOLDOWN_SECONDS,
    p_lock_seconds: GENERATION_LOCK_SECONDS,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = (data as ReserveGenerationAccessRpcRow[] | null)?.[0];

  if (!result) {
    throw new Error("Generation reservation RPC returned no result.");
  }

  const summary = toBillingAccessSummary({
    free_generations_used: result.free_generations_used,
    paid_access_until: result.paid_access_until,
  });

  return {
    ...summary,
    allowed: result.allowed,
    reason: result.reason,
    reservedFreeGeneration: result.reserved_free_generation,
    retryAfterSeconds: result.retry_after_seconds,
  };
}

export async function releaseGenerationReservation(userId: string, refundFreeGeneration: boolean) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("release_generation_reservation", {
    p_user_id: userId,
    p_refund_free_generation: refundFreeGeneration,
  });

  if (error) {
    throw new Error(error.message);
  }
}
