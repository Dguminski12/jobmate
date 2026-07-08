alter table public.interview_packs
  add column if not exists generation_context jsonb;

alter table public.interview_packs
  add column if not exists regeneration_history jsonb not null default '[]'::jsonb;

update public.interview_packs
set regeneration_history = '[]'::jsonb
where regeneration_history is null;
