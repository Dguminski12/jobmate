create or replace function public.grant_paid_access_if_eligible(
  p_user_id uuid,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text,
  p_amount_pence integer,
  p_currency text,
  p_stripe_customer_id text default null
)
returns table (
  applied boolean,
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_current_paid_access_until timestamptz;
  v_access_ends_at timestamptz;
  v_inserted_purchase_id uuid;
begin
  insert into public.user_entitlements (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select paid_access_until
    into v_current_paid_access_until
  from public.user_entitlements
  where user_id = p_user_id
  for update;

  if v_current_paid_access_until is not null and v_current_paid_access_until > v_now then
    return query
      select false, null::timestamptz, null::timestamptz, 'active_access'::text;
    return;
  end if;

  v_access_ends_at := v_now + make_interval(days => 31);

  insert into public.payment_purchases (
    user_id,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    amount_pence,
    currency,
    access_starts_at,
    access_ends_at
  )
  values (
    p_user_id,
    p_stripe_checkout_session_id,
    p_stripe_payment_intent_id,
    p_amount_pence,
    p_currency,
    v_now,
    v_access_ends_at
  )
  on conflict (stripe_checkout_session_id) do nothing
  returning id into v_inserted_purchase_id;

  if v_inserted_purchase_id is null then
    return query
      select false, null::timestamptz, null::timestamptz, 'duplicate_session'::text;
    return;
  end if;

  update public.user_entitlements
  set
    paid_access_until = v_access_ends_at,
    stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
    updated_at = now()
  where user_id = p_user_id;

  return query
    select true, v_now, v_access_ends_at, 'granted'::text;
end;
$$;

revoke all on function public.grant_paid_access_if_eligible(uuid, text, text, integer, text, text) from public;
grant execute on function public.grant_paid_access_if_eligible(uuid, text, text, integer, text, text) to service_role;
