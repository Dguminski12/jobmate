create extension if not exists pgcrypto;

create table if not exists public.interview_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  status text not null default 'ready' check (status in ('ready', 'error')),
  cv_source text not null check (cv_source in ('file', 'text')),
  cv_file_name text,
  cv_text text,
  job_url text,
  job_description text,
  screenshot_names text[] not null default '{}',
  additional_instructions text,
  ai_response jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_packs_user_created_idx on public.interview_packs (user_id, created_at desc);

alter table public.interview_packs enable row level security;

revoke all on table public.interview_packs from public;
grant select, insert, update, delete on table public.interview_packs to authenticated;

drop policy if exists "Users can read their own interview packs" on public.interview_packs;
create policy "Users can read their own interview packs"
  on public.interview_packs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own interview packs" on public.interview_packs;
create policy "Users can insert their own interview packs"
  on public.interview_packs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own interview packs" on public.interview_packs;
create policy "Users can update their own interview packs"
  on public.interview_packs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own interview packs" on public.interview_packs;
create policy "Users can delete their own interview packs"
  on public.interview_packs
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

drop trigger if exists set_interview_packs_updated_at on public.interview_packs;
create trigger set_interview_packs_updated_at
before update on public.interview_packs
for each row execute function public.set_updated_at();