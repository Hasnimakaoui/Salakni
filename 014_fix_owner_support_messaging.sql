-- 014: harden owner-support messaging policies using the authenticated profile role directly.
-- This ensures the owner inbox can read every support thread and reply, while professionals
-- can only read/write their own thread.
alter table public.professional_support_messages enable row level security;

drop policy if exists "professional and owner read support messages" on public.professional_support_messages;
drop policy if exists "professional and owner send support messages" on public.professional_support_messages;
drop policy if exists "owner marks support messages read" on public.professional_support_messages;

create policy "professional and owner read support messages"
on public.professional_support_messages
for select to authenticated
using (
  professional_id = auth.uid()
  or exists (
    select 1 from public.profiles owner_profile
    where owner_profile.id = auth.uid() and owner_profile.role = 'owner'
  )
);

create policy "professional and owner send support messages"
on public.professional_support_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and (
    (
      professional_id = auth.uid()
      and exists (
        select 1 from public.profiles professional_profile
        where professional_profile.id = auth.uid() and professional_profile.role = 'professional'
      )
    )
    or exists (
      select 1 from public.profiles owner_profile
      where owner_profile.id = auth.uid() and owner_profile.role = 'owner'
    )
  )
);

create policy "owner marks support messages read"
on public.professional_support_messages
for update to authenticated
using (
  exists (select 1 from public.profiles owner_profile where owner_profile.id = auth.uid() and owner_profile.role = 'owner')
)
with check (
  exists (select 1 from public.profiles owner_profile where owner_profile.id = auth.uid() and owner_profile.role = 'owner')
);

grant select, insert on public.professional_support_messages to authenticated;
grant update (read_at) on public.professional_support_messages to authenticated;
