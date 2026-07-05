create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null,
  job_title text not null,
  location text not null,
  salary text,
  employment_type text not null,
  application_date date not null,
  status text not null default 'Wishlist' check (status in ('Wishlist', 'Applied', 'Interview', 'Assessment', 'Offer', 'Rejected', 'Accepted')),
  job_url text,
  notes text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_application_date_idx on public.jobs (user_id, application_date desc);
create index if not exists jobs_user_id_status_idx on public.jobs (user_id, status);
create index if not exists jobs_user_id_company_idx on public.jobs (user_id, company);
create index if not exists jobs_user_id_created_at_idx on public.jobs (user_id, created_at desc);

alter table public.jobs enable row level security;

revoke all on table public.jobs from public;
grant select, insert, update, delete on table public.jobs to authenticated;

drop policy if exists "Users can read their own jobs" on public.jobs;
create policy "Users can read their own jobs"
  on public.jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own jobs" on public.jobs;
create policy "Users can insert their own jobs"
  on public.jobs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own jobs" on public.jobs;
create policy "Users can update their own jobs"
  on public.jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own jobs" on public.jobs;
create policy "Users can delete their own jobs"
  on public.jobs
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();