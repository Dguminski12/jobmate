import "server-only";

import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AuditLogEventType, ErrorLogSource } from "@/lib/admin/types";

type RequestContextInput = {
  requestHeaders?: Headers;
};

type LogAuditEventInput = RequestContextInput & {
  userId?: string | null;
  eventType: AuditLogEventType;
  metadata?: Record<string, unknown>;
};

type LogErrorInput = RequestContextInput & {
  userId?: string | null;
  source: ErrorLogSource;
  message: string;
  stack?: string | null;
  metadata?: Record<string, unknown> | null;
};

function readIpAddress(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return headerStore.get("x-real-ip");
}

async function resolveRequestContext(inputHeaders?: Headers) {
  const headerStore = inputHeaders ?? (await headers());

  return {
    ipAddress: readIpAddress(headerStore),
    userAgent: headerStore.get("user-agent"),
  };
}

export async function logAuditEvent(input: LogAuditEventInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const requestContext = await resolveRequestContext(input.requestHeaders);

    const { error } = await supabase.from("audit_logs").insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      metadata: input.metadata ?? {},
      ip_address: requestContext.ipAddress,
      user_agent: requestContext.userAgent,
    });

    if (error) {
      console.error("[observability] Failed to insert audit log", {
        eventType: input.eventType,
        error: error.message,
      });
    }
  } catch (error) {
    console.error("[observability] Unexpected audit log failure", {
      eventType: input.eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function logError(input: LogErrorInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const requestContext = await resolveRequestContext(input.requestHeaders);

    const { error } = await supabase.from("error_logs").insert({
      user_id: input.userId ?? null,
      source: input.source,
      message: input.message,
      stack: input.stack ?? null,
      metadata: input.metadata ?? null,
      ip_address: requestContext.ipAddress,
      user_agent: requestContext.userAgent,
    });

    if (error) {
      console.error("[observability] Failed to insert error log", {
        source: input.source,
        error: error.message,
      });
    }
  } catch (error) {
    console.error("[observability] Unexpected error log failure", {
      source: input.source,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
