-- Publish only approved, active, subscribed professionals through a narrow RPC.
-- The RPC returns a fixed, safe field list; the profiles table is not made public.
create or replace function public.get_professional_directory()
returns table (
  professional_id uuid,
  display_name text,
  city text,
  wilaya text,
  bio text,
  avatar_url text,
  is_verified boolean,
  service_id uuid,
  service_title text,
  category text,
  starting_price_dzd integer,
  average_rating numeric,
  completed_jobs integer,
  description text,
  phone text
)
language sql
stable
security definer
set search_path = public
as $fn$
  select p.id, p.display_name, coalesce(p.city, ''), coalesce(p.wilaya, ''),
         p.bio, p.avatar_url, p.is_verified, s.id, s.title, s.category,
         s.starting_price_dzd, coalesce(rev.average_rating, 0)::numeric(3,1),
         coalesce(stats.completed_jobs, 0)::integer, s.description, p.phone
  from public.profiles p
  join public.professional_services s on s.professional_id = p.id and s.is_active
  left join lateral (
    select avg(r.rating) as average_rating from public.reviews r
    where r.professional_id = p.id
  ) rev on true
  left join lateral (
    select count(*) as completed_jobs from public.service_requests sr
    where sr.professional_id = p.id and sr.status = 'completed'
  ) stats on true
  where p.role = 'professional'
    and p.is_verified
    and p.subscription_active
    and (p.subscription_ends_at is null or p.subscription_ends_at > now())
    and not p.is_suspended
  order by (p.subscription_plan in ('pro_monthly','pro_yearly')) desc,
           coalesce(rev.average_rating, 0) desc, p.display_name asc;
$fn$;
comment on function public.get_professional_directory() is
  'Public read-only directory returning only approved, subscribed, non-suspended professionals and safe contact fields.';
revoke all on function public.get_professional_directory() from public, anon, authenticated;
grant execute on function public.get_professional_directory() to anon, authenticated;

drop view if exists public.professional_directory;

-- Enforce phone validity on creation, role conversion, and phone edits.
create or replace function public.guard_professional_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $phone_guard$
declare actor_is_owner boolean := false;
begin
  if auth.uid() is not null then
    select exists(select 1 from public.profiles actor where actor.id=auth.uid() and actor.role='owner')
      into actor_is_owner;
  end if;
  if tg_op = 'INSERT' then
    if new.role = 'professional' and nullif(btrim(new.phone), '') is null then
      raise exception 'Professional phone number is required';
    end if;
    if new.role = 'professional' and btrim(new.phone) !~ '^([+]213|0)[0-9]{8,9}$' then
      raise exception 'Enter a valid Algerian phone number';
    end if;
    return new;
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile identity and creation time are immutable';
  end if;
  if auth.uid() is not null and coalesce(auth.jwt()->>'role','') <> 'service_role' and not actor_is_owner then
    if new.role is distinct from old.role or new.is_verified is distinct from old.is_verified then
      raise exception 'Changing account role or verification is not allowed';
    end if;
  end if;
  if new.role = 'professional' and
     (new.phone is distinct from old.phone or new.role is distinct from old.role) then
    if nullif(btrim(new.phone), '') is null then
      raise exception 'Professional phone number is required';
    end if;
    if btrim(new.phone) !~ '^([+]213|0)[0-9]{8,9}$' then
      raise exception 'Enter a valid Algerian phone number';
    end if;
  end if;
  if auth.uid() = old.id and old.role = 'professional' and not actor_is_owner then
    if nullif(btrim(old.phone), '') is not null and new.phone is distinct from old.phone then
      raise exception 'Professional phone number is fixed and cannot be changed';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$phone_guard$;

-- Trigger functions are only for triggers, never direct RPC calls.
revoke all on function public.audit_service_request_status() from public, anon, authenticated;
revoke all on function public.guard_report_review_updates() from public, anon, authenticated;
revoke all on function public.audit_report_review() from public, anon, authenticated;
revoke all on function public.guard_service_request_identity() from public, anon, authenticated;
revoke all on function public.ensure_request_conversation() from public, anon, authenticated;
revoke all on function public.guard_service_request_updates() from public, anon, authenticated;
revoke all on function public.prevent_profile_role_escalation() from public, anon, authenticated;
revoke all on function public.require_phone_for_professional_service() from public, anon, authenticated;
revoke all on function public.guard_professional_phone() from public, anon, authenticated;
revoke all on function public.audit_owner_admin_changes() from public, anon, authenticated;

-- Keep admin RPCs available only to signed-in clients; each function checks owner/staff role.
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;
revoke all on function public.is_moderator_or_owner() from public, anon;
grant execute on function public.is_moderator_or_owner() to authenticated;
revoke all on function public.owner_delete_account(uuid) from public, anon;
grant execute on function public.owner_delete_account(uuid) to authenticated;
revoke all on function public.review_subscription_payment(uuid, boolean, text) from public, anon;
grant execute on function public.review_subscription_payment(uuid, boolean, text) to authenticated;
