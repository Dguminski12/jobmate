import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  FREE_GENERATION_LIMIT,
  type BillingAccessSummary,
  type GenerationAccessResult,
  type UserEntitlementRecord,
} from "./types";

function toBillingAccessSummary(record: Pick<UserEntitlementRecord, "free_generations_used" | "paid_access_until">): BillingAccessSummary {
  const paidAccessUntil = record.paid_access_until;
  const hasActiveAccess = Boolean(paidAccessUntil && new Date(paidAccessUntil).getTime() > Date.now());

  return {
    freeGenerationsUsed: record.free_generations_used,
    freeGenerationsRemaining: Math.max(0, FREE_GENERATION_LIMIT - record.free_generations_used),
    paidAccessUntil,
    hasActiveAccess,
  };
}

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