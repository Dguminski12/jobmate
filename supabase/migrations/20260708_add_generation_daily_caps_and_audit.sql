create table if not exists public.generation_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action_type text not null check (action_type in ('generate', 'regenerate')),
  status text not null check (status in ('reserved', 'completed', 'failed', 'blocked')),
  blocked_reason text,
  reserved_free_generation boolean not null default false,
  refunded_free_generation boolean not null default false,
  retry_after_seconds integer not null default 0 check (retry_after_seconds >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists generation_audit_log_user_created_idx
  on public.generation_audit_log (user_id, created_at desc);

alter table public.generation_audit_log enable row level security;

revoke all on table public.generation_audit_log from public;
grant select on table public.generation_audit_log to authenticated;

drop policy if exists "Users can read their own generation audit log" on public.generation_audit_log;
create policy "Users can read their own generation audit log"
  on public.generation_audit_log
  for select
  using (auth.uid() = user_id);

alter table public.user_entitlements
  add column if not exists daily_generation_count integer not null default 0 check (daily_generation_count >= 0),
  add column if not exists daily_generation_window_started_at timestamptz,
  add column if not exists current_generation_audit_id uuid;

create or replace function public.reserve_generation_access(
  p_user_id uuid,
  p_action_type text,
  p_free_generation_limit integer,
  p_daily_generation_limit integer,
  p_cooldown_seconds integer,
  p_lock_seconds integer
)
returns table (
  allowed boolean,
  reason text,
  reserved_free_generation boolean,
  retry_after_seconds integer,
  free_generations_used integer,
  paid_access_until timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_entitlement public.user_entitlements%rowtype;
  v_has_active_access boolean;
  v_retry_after_seconds integer := 0;
  v_daily_window_start timestamptz;
  v_daily_generation_count integer;
  v_audit_id uuid;
begin
  if auth.uid() is distinct from p_user_id then
    return query
      select false, 'unauthorized'::text, false, 0, 0, null::timestamptz;
    return;
  end if;

  if p_action_type not in ('generate', 'regenerate') then
    raise exception 'Unsupported generation action type: %', p_action_type;
  end if;

  insert into public.user_entitlements (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
    into v_entitlement
  from public.user_entitlements
  where user_id = p_user_id
  for update;

  v_has_active_access :=
    v_entitlement.paid_access_until is not null
    and v_entitlement.paid_access_until > v_now;

  v_daily_window_start := v_entitlement.daily_generation_window_started_at;
  v_daily_generation_count := v_entitlement.daily_generation_count;

  if v_daily_window_start is null or (v_daily_window_start + interval '1 day') <= v_now then
    v_daily_window_start := v_now;
    v_daily_generation_count := 0;
  end if;

  if v_entitlement.generation_lock_until is not null and v_entitlement.generation_lock_until > v_now then
    v_retry_after_seconds := greatest(1, ceil(extract(epoch from (v_entitlement.generation_lock_until - v_now)))::integer);

    insert into public.generation_audit_log (
      user_id,
      action_type,
      status,
      blocked_reason,
      retry_after_seconds
    )
    values (
      p_user_id,
      p_action_type,
      'blocked',
      'generation_in_progress',
      v_retry_after_seconds
    );

    return query
      select
        false,
        'generation_in_progress'::text,
        false,
        v_retry_after_seconds,
        v_entitlement.free_generations_used,
        v_entitlement.paid_access_until;
    return;
  end if;

  if v_entitlement.last_generation_at is not null
    and (v_entitlement.last_generation_at + make_interval(secs => p_cooldown_seconds)) > v_now then
    v_retry_after_seconds := greatest(
      1,
      ceil(extract(epoch from ((v_entitlement.last_generation_at + make_interval(secs => p_cooldown_seconds)) - v_now)))::integer
    );

    insert into public.generation_audit_log (
      user_id,
      action_type,
      status,
      blocked_reason,
      retry_after_seconds
    )
    values (
      p_user_id,
      p_action_type,
      'blocked',
      'cooldown_active',
      v_retry_after_seconds
    );

    return query
      select
        false,
        'cooldown_active'::text,
        false,
        v_retry_after_seconds,
        v_entitlement.free_generations_used,
        v_entitlement.paid_access_until;
    return;
  end if;

  if v_daily_generation_count >= p_daily_generation_limit then
    v_retry_after_seconds := greatest(
      1,
      ceil(extract(epoch from ((v_daily_window_start + interval '1 day') - v_now)))::integer
    );

    insert into public.generation_audit_log (
      user_id,
      action_type,
      status,
      blocked_reason,
      retry_after_seconds
    )
    values (
      p_user_id,
      p_action_type,
      'blocked',
      'daily_limit_reached',
      v_retry_after_seconds
    );

    return query
      select
        false,
        'daily_limit_reached'::text,
        false,
        v_retry_after_seconds,
        v_entitlement.free_generations_used,
        v_entitlement.paid_access_until;
    return;
  end if;

  if not v_has_active_access and v_entitlement.free_generations_used >= p_free_generation_limit then
    insert into public.generation_audit_log (
      user_id,
      action_type,
      status,
      blocked_reason
    )
    values (
      p_user_id,
      p_action_type,
      'blocked',
      'paywall_blocked'
    );

    return query
      select
        false,
        'paywall_blocked'::text,
        false,
        0,
        v_entitlement.free_generations_used,
        v_entitlement.paid_access_until;
    return;
  end if;

  insert into public.generation_audit_log (
    user_id,
    action_type,
    status,
    reserved_free_generation
  )
  values (
    p_user_id,
    p_action_type,
    'reserved',
    (not v_has_active_access)
  )
  returning id into v_audit_id;

  update public.user_entitlements
  set
    free_generations_used = case
      when v_has_active_access then free_generations_used
      else free_generations_used + 1
    end,
    daily_generation_count = v_daily_generation_count + 1,
    daily_generation_window_started_at = v_daily_window_start,
    last_generation_at = v_now,
    generation_lock_until = v_now + make_interval(secs => p_lock_seconds),
    current_generation_audit_id = v_audit_id,
    updated_at = v_now
  where user_id = p_user_id
  returning *
  into v_entitlement;

  return query
    select
      true,
      'granted'::text,
      (not v_has_active_access),
      0,
      v_entitlement.free_generations_used,
      v_entitlement.paid_access_until;
end;
$$;

create or replace function public.release_generation_reservation(
  p_user_id uuid,
  p_refund_free_generation boolean default false,
  p_was_successful boolean default false,
  p_error_message text default null
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
      completed_at = v_now
    where id = v_audit_id;
  end if;
end;
$$;

revoke all on function public.reserve_generation_access(uuid, text, integer, integer, integer, integer) from public;
grant execute on function public.reserve_generation_access(uuid, text, integer, integer, integer, integer) to authenticated;

revoke all on function public.release_generation_reservation(uuid, boolean, boolean, text) from public;
grant execute on function public.release_generation_reservation(uuid, boolean, boolean, text) to authenticated;
