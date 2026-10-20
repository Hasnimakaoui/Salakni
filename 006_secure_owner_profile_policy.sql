-- Migration 006: allow owner-controlled profile editing while keeping the helper private.
create or replace function public.current_user_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;
revoke all on function public.current_user_is_owner() from public;
grant execute on function public.current_user_is_owner() to authenticated;

drop policy if exists "owner full profile management" on public.profiles;
create policy "owner full profile management" on public.profiles
for all to authenticated
using (public.current_user_is_owner())
with check (public.current_user_is_owner());
