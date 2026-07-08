create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  free_generations_used integer not null default 0 check (free_generations_used >= 0),
  paid_access_until timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_pence integer not null check (amount_pence >= 0),
  currency text not null default 'gbp',
  access_starts_at timestamptz not null,
  access_ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists payment_purchases_user_created_idx on public.payment_purchases (user_id, created_at desc);

alter table public.user_entitlements enable row level security;
alter table public.payment_purchases enable row level security;

revoke all on table public.user_entitlements from public;
revoke all on table public.payment_purchases from public;
grant select, update on table public.user_entitlements to authenticated;
grant select on table public.payment_purchases to authenticated;

drop policy if exists "Users can read their own entitlements" on public.user_entitlements;
create policy "Users can read their own entitlements"
  on public.user_entitlements
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own entitlements" on public.user_entitlements;
create policy "Users can update their own entitlements"
  on public.user_entitlements
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert their own entitlements" on public.user_entitlements;
create policy "Users can insert their own entitlements"
  on public.user_entitlements
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own purchases" on public.payment_purchases;
create policy "Users can read their own purchases"
  on public.payment_purchases
  for select
  using (auth.uid() = user_id);

drop trigger if exists set_user_entitlements_updated_at on public.user_entitlements;
create trigger set_user_entitlements_updated_at
before update on public.user_entitlements
for each row execute function public.set_updated_at();
