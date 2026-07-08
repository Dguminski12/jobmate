import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAuditEvent, logError } from "@/lib/observability/server";
import type {
  AdminDashboardData,
  AdminProfileRecord,
  AuditLogRecord,
  ErrorLogRecord,
  GenerationAuditLogRecord,
} from "./types";

function getStartOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function getStartOfMonth() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function sumEstimatedCost(rows: Array<{ estimated_cost_gbp: number | string | null }>) {
  return rows.reduce((total, row) => {
    const value = typeof row.estimated_cost_gbp === "string" ? Number(row.estimated_cost_gbp) : row.estimated_cost_gbp;
    return total + (Number.isFinite(value) ? Number(value) : 0);
  }, 0);
}

export async function isCurrentUserAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false, supabase };
  }

  const { data: membership } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    isAdmin: Boolean(membership),
    supabase,
  };
}

export async function requireAdminUser() {
  const { user, isAdmin, supabase } = await isCurrentUserAdmin();

  if (!user) {
    await logAuditEvent({
      eventType: "admin_access_denied",
      metadata: {
        route: "/admin",
        reason: "unauthenticated",
      },
    });
    redirect("/login");
  }

  if (!isAdmin) {
    await logAuditEvent({
      userId: user.id,
      eventType: "admin_access_denied",
      metadata: {
        route: "/admin",
        reason: "not_admin",
      },
    });
    redirect("/dashboard/packs");
  }

  return { user, supabase };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { user, supabase } = await requireAdminUser();
  const todayStart = getStartOfToday();
  const monthStart = getStartOfMonth();

  const [
    totalUsersResult,
    newUsersTodayResult,
    totalAiTodayResult,
    totalAiThisMonthResult,
    failedGenerationsTodayResult,
    recentAuditLogsResult,
    recentErrorLogsResult,
    recentUsersResult,
    recentAiRequestsResult,
    failedAiRequestsResult,
    tokenCostsTodayResult,
    tokenCostsMonthResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase
      .from("generation_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", todayStart),
    supabase
      .from("generation_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", monthStart),
    supabase
      .from("generation_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", todayStart),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(12),
    supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(12),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("generation_audit_log").select("*").order("created_at", { ascending: false }).limit(12),
    supabase
      .from("generation_audit_log")
      .select("*")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("generation_audit_log")
      .select("estimated_cost_gbp")
      .gte("created_at", todayStart)
      .not("estimated_cost_gbp", "is", null),
    supabase
      .from("generation_audit_log")
      .select("estimated_cost_gbp")
      .gte("created_at", monthStart)
      .not("estimated_cost_gbp", "is", null),
  ]);

  const queryErrors = [
    totalUsersResult.error,
    newUsersTodayResult.error,
    totalAiTodayResult.error,
    totalAiThisMonthResult.error,
    failedGenerationsTodayResult.error,
    recentAuditLogsResult.error,
    recentErrorLogsResult.error,
    recentUsersResult.error,
    recentAiRequestsResult.error,
    failedAiRequestsResult.error,
    tokenCostsTodayResult.error,
    tokenCostsMonthResult.error,
  ].filter(Boolean);

  if (queryErrors.length > 0) {
    const message = queryErrors[0]?.message ?? "Unable to load admin dashboard data.";
    await logError({
      userId: user.id,
      source: "admin",
      message,
      metadata: {
        route: "/admin",
      },
      requestHeaders: await headers(),
    });
    throw new Error(message);
  }

  await logAuditEvent({
    userId: user.id,
    eventType: "admin_viewed_dashboard",
    metadata: {
      route: "/admin",
      sectionsLoaded: [
        "stats",
        "recent_audit_logs",
        "recent_error_logs",
        "recent_users",
        "recent_ai_requests",
        "failed_ai_requests",
      ],
    },
    requestHeaders: await headers(),
  });

  return {
    stats: {
      totalUsers: totalUsersResult.count ?? 0,
      newUsersToday: newUsersTodayResult.count ?? 0,
      totalAiGenerationsToday: totalAiTodayResult.count ?? 0,
      totalAiGenerationsThisMonth: totalAiThisMonthResult.count ?? 0,
      failedGenerationsToday: failedGenerationsTodayResult.count ?? 0,
      estimatedTokenCostTodayGbp: sumEstimatedCost(tokenCostsTodayResult.data ?? []),
      estimatedTokenCostThisMonthGbp: sumEstimatedCost(tokenCostsMonthResult.data ?? []),
    },
    recentAuditLogs: (recentAuditLogsResult.data ?? []) as AuditLogRecord[],
    recentErrorLogs: (recentErrorLogsResult.data ?? []) as ErrorLogRecord[],
    recentUsers: (recentUsersResult.data ?? []) as AdminProfileRecord[],
    recentAiRequests: (recentAiRequestsResult.data ?? []) as GenerationAuditLogRecord[],
    failedAiRequests: (failedAiRequestsResult.data ?? []) as GenerationAuditLogRecord[],
  };
}
