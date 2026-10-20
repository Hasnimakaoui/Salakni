-- 013: enable realtime delivery for the private owner-support inbox.
do $publication$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(
       select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='professional_support_messages'
     ) then
    alter publication supabase_realtime add table public.professional_support_messages;
  end if;
end;
$publication$;
