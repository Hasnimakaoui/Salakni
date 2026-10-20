-- Publish only approved, active, subscribed professionals through a narrow RPC.
-- This avoids exposing the profiles table and avoids a SECURITY DEFINER view.
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
as $$
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
    coalesce(stats.completed_jobs, 0)::integer as completed_jobs,
    s.description as description,
    p.phone as phone
  from public.profiles p
  join public.professional_services s on s.professional_id = p.id and s.is_active
  left join lateral (
    select avg(r.rating) as average_rating
    from public.reviews r where r.professional_id = p.id
  ) rev on true
  left join lateral (
    select count(*) as completed_jobs
    from public.service_requests sr
    where sr.professional_id = p.id and sr.status = 'completed'
  ) stats on true
  where p.role = 'professional'
    and p.is_verified
    and p.subscription_active
    and (p.subscription_ends_at is null or p.subscription_ends_at > now())
    and not p.is_suspended
  order by (p.subscription_plan in ('pro_monthly','pro_yearly')) desc,
           coalesce(rev.average_rating, 0) desc,
           p.display_name asc;
$$;
comment on function public.get_professional_directory() is
  'Public read-only directory; returns only approved, subscribed, non-suspended professionals and safe contact fields.';
revoke all on function public.get_professional_directory() from public, anon, authenticated;
grant execute on function public.get_professional_directory() to anon, authenticated;

drop view if exists public.professional_directory;

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

-- These helpers are available only to authenticated policy evaluation/admin UI.
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;
revoke all on function public.is_moderator_or_owner() from public, anon;
grant execute on function public.is_moderator_or_owner() to authenticated;
revoke all on function public.owner_delete_account(uuid) from public, anon;
grant execute on function public.owner_delete_account(uuid) to authenticated;
revoke all on function public.review_subscription_payment(uuid, boolean, text) from public, anon;
grant execute on function public.review_subscription_payment(uuid, boolean, text) to authenticated;
