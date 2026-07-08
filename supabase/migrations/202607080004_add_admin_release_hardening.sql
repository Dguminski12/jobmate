create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from public;
grant select on table public.admin_users to authenticated;

create or replace function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = p_user_id
  );
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to authenticated;

-- Users can confirm their own admin membership row without exposing the full table.
drop policy if exists "Users can read their own admin membership" on public.admin_users;
create policy "Users can read their own admin membership"
  on public.admin_users
  for select
  using (auth.uid() = user_id);

-- Admin users can read the full admin membership list for admin tooling.
drop policy if exists "Admins can read all admin memberships" on public.admin_users;
create policy "Admins can read all admin memberships"
  on public.admin_users
  for select
  using (public.is_admin_user(auth.uid()));

-- Admin users need read access to profile rows for user counts and recent-user views.
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles
  for select
  using (public.is_admin_user(auth.uid()));

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_event_created_idx
  on public.audit_logs (event_type, created_at desc);

alter table public.audit_logs enable row level security;

revoke all on table public.audit_logs from public;
grant select on table public.audit_logs to authenticated;

-- Audit logs are admin-only operational records. Normal users get no read policy.
drop policy if exists "Admins can read all audit logs" on public.audit_logs;
create policy "Admins can read all audit logs"
  on public.audit_logs
  for select
  using (public.is_admin_user(auth.uid()));

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  source text not null,
  message text not null,
  stack text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists error_logs_created_idx
  on public.error_logs (created_at desc);

create index if not exists error_logs_source_created_idx
  on public.error_logs (source, created_at desc);

alter table public.error_logs enable row level security;

revoke all on table public.error_logs from public;
grant select on table public.error_logs to authenticated;

-- Error logs are admin-only diagnostics. Normal users get no read policy.
drop policy if exists "Admins can read all error logs" on public.error_logs;
create policy "Admins can read all error logs"
  on public.error_logs
  for select
  using (public.is_admin_user(auth.uid()));

alter table public.generation_audit_log
  add column if not exists model_name text,
  add column if not exists prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  add column if not exists completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  add column if not exists total_tokens integer check (total_tokens is null or total_tokens >= 0),
  add column if not exists estimated_cost_gbp numeric(12, 6) check (estimated_cost_gbp is null or estimated_cost_gbp >= 0);

-- Normal users keep access to their own AI request records.
drop policy if exists "Users can read their own generation audit log" on public.generation_audit_log;
create policy "Users can read their own generation audit log"
  on public.generation_audit_log
  for select
  using (auth.uid() = user_id);

-- Admin users can review all AI request records for support and abuse monitoring.
drop policy if exists "Admins can read all generation audit logs" on public.generation_audit_log;
create policy "Admins can read all generation audit logs"
  on public.generation_audit_log
  for select
  using (public.is_admin_user(auth.uid()));

create or replace function public.release_generation_reservation(
  p_user_id uuid,
  p_refund_free_generation boolean default false,
  p_was_successful boolean default false,
  p_error_message text default null,
  p_model_name text default null,
  p_prompt_tokens integer default null,
  p_completion_tokens integer default null,
  p_total_tokens integer default null,
  p_estimated_cost_gbp numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_audit_id uuid;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized release request for generation reservation.';
  end if;

  select current_generation_audit_id
    into v_audit_id
  from public.user_entitlements
  where user_id = p_user_id
  for update;

  update public.user_entitlements
  set
    free_generations_used = case
      when p_refund_free_generation and free_generations_used > 0 then free_generations_used - 1
      else free_generations_used
    end,
    generation_lock_until = null,
    current_generation_audit_id = null,
    updated_at = v_now
  where user_id = p_user_id;

  if v_audit_id is not null then
    update public.generation_audit_log
    set
      status = case when p_was_successful then 'completed' else 'failed' end,
      refunded_free_generation = p_refund_free_generation,
      error_message = case when p_was_successful then null else p_error_message end,
      model_name = coalesce(p_model_name, model_name),
      prompt_tokens = coalesce(p_prompt_tokens, prompt_tokens),
      completion_tokens = coalesce(p_completion_tokens, completion_tokens),
      total_tokens = coalesce(p_total_tokens, total_tokens),
      estimated_cost_gbp = coalesce(p_estimated_cost_gbp, estimated_cost_gbp),
      completed_at = v_now
    where id = v_audit_id;
  end if;
end;
$$;

revoke all on function public.release_generation_reservation(uuid, boolean, boolean, text, text, integer, integer, integer, numeric) from public;
grant execute on function public.release_generation_reservation(uuid, boolean, boolean, text, text, integer, integer, integer, numeric) to authenticated;
