alter table public.user_entitlements
  add column if not exists last_generation_at timestamptz,
  add column if not exists generation_lock_until timestamptz;

create or replace function public.reserve_generation_access(
  p_user_id uuid,
  p_free_generation_limit integer,
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
begin
  if auth.uid() is distinct from p_user_id then
    return query
      select false, 'unauthorized'::text, false, 0, 0, null::timestamptz;
    return;
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

  if v_entitlement.generation_lock_until is not null and v_entitlement.generation_lock_until > v_now then
    v_retry_after_seconds := greatest(1, ceil(extract(epoch from (v_entitlement.generation_lock_until - v_now)))::integer);

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

  if not v_has_active_access and v_entitlement.free_generations_used >= p_free_generation_limit then
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

  update public.user_entitlements
  set
    free_generations_used = case
      when v_has_active_access then free_generations_used
      else free_generations_used + 1
    end,
    last_generation_at = v_now,
    generation_lock_until = v_now + make_interval(secs => p_lock_seconds),
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
  p_refund_free_generation boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized release request for generation reservation.';
  end if;

  update public.user_entitlements
  set
    free_generations_used = case
      when p_refund_free_generation and free_generations_used > 0 then free_generations_used - 1
      else free_generations_used
    end,
    generation_lock_until = null,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke all on function public.reserve_generation_access(uuid, integer, integer, integer) from public;
grant execute on function public.reserve_generation_access(uuid, integer, integer, integer) to authenticated;

revoke all on function public.release_generation_reservation(uuid, boolean) from public;
grant execute on function public.release_generation_reservation(uuid, boolean) to authenticated;
