-- Replace the owner policy helper with the existing hardened is_owner() function.
drop policy if exists "owner full profile management" on public.profiles;
create policy "owner full profile management" on public.profiles
for all to authenticated
using (public.is_owner())
with check (public.is_owner());
revoke all on function public.current_user_is_owner() from public, anon, authenticated;
drop function if exists public.current_user_is_owner();
