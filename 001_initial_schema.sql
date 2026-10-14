-- Salakni initial schema. Review and apply in a dedicated Supabase project.
create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'professional', 'moderator', 'owner');
create type public.request_status as enum ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  phone text,
  city text,
  wilaya text,
  bio text,
  avatar_url text,
  role public.app_role not null default 'customer',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  category text not null,
  description text,
  starting_price_dzd integer check (starting_price_dzd is null or starting_price_dzd >= 0),
  wilaya text not null,
  city text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.professional_services(id) on delete set null,
  title text not null,
  details text,
  preferred_at timestamptz,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (customer_id <> professional_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.service_requests(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1500),
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(customer_id, professional_id),
  check (customer_id <> professional_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_profile_id uuid references public.profiles(id) on delete set null,
  request_id uuid references public.service_requests(id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index professional_services_search_idx on public.professional_services (wilaya, city, category) where is_active;
create index service_requests_customer_idx on public.service_requests(customer_id, created_at desc);
create index service_requests_professional_idx on public.service_requests(professional_id, created_at desc);
create index messages_conversation_idx on public.messages(conversation_id, created_at);

-- Public directory exposes only safe professional fields, never phone numbers or auth data.
create or replace view public.professional_directory as
select
  p.id as professional_id,
  p.display_name,
  coalesce(p.city, '') as city,
  coalesce(p.wilaya, '') as wilaya,
  p.bio,
  p.avatar_url,
  p.is_verified,
  s.id as service_id,
  s.title as service_title,
  s.category,
  s.starting_price_dzd,
  coalesce(rev.average_rating, 0)::numeric(3,1) as average_rating,
  coalesce(stats.completed_jobs, 0)::integer as completed_jobs
from public.profiles p
join public.professional_services s on s.professional_id = p.id and s.is_active
left join lateral (
  select avg(r.rating) as average_rating
  from public.reviews r where r.professional_id = p.id
) rev on true
left join lateral (
  select count(*) as completed_jobs
  from public.service_requests sr where sr.professional_id = p.id and sr.status = 'completed'
) stats on true
where p.role = 'professional';

grant select on public.professional_directory to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.professional_services enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles visible to authenticated users" on public.profiles;
create policy "users view own profile" on public.profiles
for select to authenticated using (id = auth.uid());
create policy "users create own profile" on public.profiles
for insert to authenticated with check (id = auth.uid() and role in ('customer','professional'));
-- Keep account roles immutable from client-side profile updates. Owner promotion must be
-- performed only by a trusted server/admin operation, never by the mobile client.
create or replace function public.prevent_profile_role_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  -- Permit trusted dashboard/migration operations where auth.uid() is null, but
  -- prevent every normal client from editing protected authorization fields.
  if auth.uid() is not null and coalesce(auth.jwt()->>'role','') <> 'service_role' then
    if new.role is distinct from old.role or new.is_verified is distinct from old.is_verified then
      raise exception 'Changing account role or verification is not allowed';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_role_guard before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create policy "users update own public profile" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "active services visible to all" on public.professional_services
for select to anon, authenticated using (is_active);
create policy "professionals manage own services" on public.professional_services
for all to authenticated
using (professional_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'professional'))
with check (professional_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'professional'));

create policy "participants read requests" on public.service_requests
for select to authenticated using (customer_id = auth.uid() or professional_id = auth.uid());
create policy "customers create requests" on public.service_requests
for insert to authenticated with check (
  customer_id = auth.uid()
  and professional_id <> auth.uid()
  and exists (select 1 from public.profiles p where p.id = professional_id and p.role = 'professional')
  and (service_id is null or exists (
    select 1 from public.professional_services s
    where s.id = service_id and s.professional_id = professional_id and s.is_active
  ))
);

create or replace function public.guard_service_request_updates()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'role','') = 'service_role' then return new; end if;
  if auth.uid() = old.customer_id then
    if new.customer_id is distinct from old.customer_id
      or new.professional_id is distinct from old.professional_id
      or new.service_id is distinct from old.service_id
      or new.title is distinct from old.title
      or new.details is distinct from old.details
      or new.preferred_at is distinct from old.preferred_at then
      raise exception 'Customer cannot change request ownership or service';
    end if;
    if old.status <> 'pending' and new.status is distinct from old.status then
      raise exception 'Only pending requests can be cancelled by the customer';
    end if;
    if new.status not in ('pending','cancelled') then
      raise exception 'Customer cannot set a professional workflow status';
    end if;
  elsif auth.uid() = old.professional_id then
    if new.customer_id is distinct from old.customer_id
      or new.professional_id is distinct from old.professional_id
      or new.service_id is distinct from old.service_id
      or new.title is distinct from old.title
      or new.details is distinct from old.details
      or new.preferred_at is distinct from old.preferred_at then
      raise exception 'Professional cannot change request details or ownership';
    end if;
    if not (
      (old.status = 'pending' and new.status in ('pending','accepted','cancelled')) or
      (old.status = 'accepted' and new.status in ('accepted','in_progress','cancelled')) or
      (old.status = 'in_progress' and new.status in ('in_progress','completed')) or
      (old.status = new.status)
    ) then raise exception 'Invalid service request status transition'; end if;
  else
    raise exception 'Not a participant in this request';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger service_request_update_guard before update on public.service_requests
for each row execute function public.guard_service_request_updates();

create policy "participants update requests" on public.service_requests
for update to authenticated using (customer_id = auth.uid() or professional_id = auth.uid())
with check (customer_id = auth.uid() or professional_id = auth.uid());

create policy "reviews visible" on public.reviews for select to anon, authenticated using (true);
create policy "customers review completed own requests" on public.reviews
for insert to authenticated with check (
  customer_id = auth.uid() and exists (
    select 1 from public.service_requests r
    where r.id = request_id and r.customer_id = auth.uid()
      and r.professional_id = reviews.professional_id and r.status = 'completed'
  )
);

create policy "conversation participants read" on public.conversations
for select to authenticated using (customer_id = auth.uid() or professional_id = auth.uid());
create policy "participants create conversations" on public.conversations
for insert to authenticated with check (customer_id = auth.uid() or professional_id = auth.uid());
create policy "messages read by conversation participants" on public.messages
for select to authenticated using (exists (
  select 1 from public.conversations c where c.id = conversation_id
  and (c.customer_id = auth.uid() or c.professional_id = auth.uid())
));
create policy "participants send messages" on public.messages
for insert to authenticated with check (sender_id = auth.uid() and exists (
  select 1 from public.conversations c where c.id = conversation_id
  and (c.customer_id = auth.uid() or c.professional_id = auth.uid())
));

create policy "users create reports" on public.reports
for insert to authenticated with check (reporter_id = auth.uid());
create policy "reporters view own reports" on public.reports
for select to authenticated using (reporter_id = auth.uid());

-- IMPORTANT: owner/moderator assignment must be performed by a trusted server/admin workflow.
-- Never allow a client to promote itself to owner. Review role-change policies before production.


-- Create a conversation automatically when a real service request is created.
-- Multiple requests between the same pair reuse one private conversation.
create or replace function public.ensure_request_conversation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.conversations(customer_id, professional_id)
  values (new.customer_id, new.professional_id)
  on conflict (customer_id, professional_id) do nothing;
  return new;
end;
$$;
create trigger service_request_create_conversation
  after insert on public.service_requests
  for each row execute function public.ensure_request_conversation();


-- Enable realtime delivery for private chat inserts on Supabase projects.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;


-- Staff-only helpers and policies for the moderation dashboard.
create or replace function public.is_moderator_or_owner()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator','owner')
  );
$$;
revoke all on function public.is_moderator_or_owner() from public;
grant execute on function public.is_moderator_or_owner() to authenticated;

create policy "staff view profiles" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_moderator_or_owner());
create policy "staff view all service requests" on public.service_requests
for select to authenticated using (public.is_moderator_or_owner());
create policy "staff view reports" on public.reports
for select to authenticated using (public.is_moderator_or_owner());
create policy "staff update reports" on public.reports
for update to authenticated using (public.is_moderator_or_owner()) with check (public.is_moderator_or_owner());

create policy "staff view all professional services" on public.professional_services
for select to authenticated using (public.is_moderator_or_owner());
