export type AdminUserRecord = {
  user_id: string;
  created_at: string;
};

export type AuditLogEventType =
  | "user_signed_up"
  | "ai_generation_started"
  | "ai_generation_completed"
  | "ai_generation_failed"
  | "regeneration_started"
  | "regeneration_completed"
  | "upload_failed"
  | "daily_cap_reached"
  | "admin_viewed_dashboard"
  | "admin_access_denied";

export type AuditLogRecord = {
  id: string;
  user_id: string | null;
  event_type: AuditLogEventType | string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type ErrorLogSource =
  | "ai_generation"
  | "regeneration"
  | "upload"
  | "validation"
  | "auth"
  | "admin"
  | "api"
  | "frontend";

export type ErrorLogRecord = {
  id: string;
  user_id: string | null;
  source: ErrorLogSource | string;
  message: string;
  stack: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type GenerationAuditLogRecord = {
  id: string;
  user_id: string;
  action_type: "generate" | "regenerate";
  status: "reserved" | "completed" | "failed" | "blocked";
  blocked_reason: string | null;
  reserved_free_generation: boolean;
  refunded_free_generation: boolean;
  retry_after_seconds: number;
  error_message: string | null;
  model_name: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_gbp: number | string | null;
  created_at: string;
  completed_at: string | null;
};

export type AdminProfileRecord = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminDashboardStats = {
  totalUsers: number;
  newUsersToday: number;
  totalAiGenerationsToday: number;
  totalAiGenerationsThisMonth: number;
  failedGenerationsToday: number;
  estimatedTokenCostTodayGbp: number;
  estimatedTokenCostThisMonthGbp: number;
};

export type AdminDashboardData = {
  stats: AdminDashboardStats;
  recentAuditLogs: AuditLogRecord[];
  recentErrorLogs: ErrorLogRecord[];
  recentUsers: AdminProfileRecord[];
  recentAiRequests: GenerationAuditLogRecord[];
  failedAiRequests: GenerationAuditLogRecord[];
};
