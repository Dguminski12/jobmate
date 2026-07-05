drop policy if exists "Users can insert their own entitlements" on public.user_entitlements;
create policy "Users can insert their own entitlements"
  on public.user_entitlements
  for insert
  with check (auth.uid() = user_id);