-- Salakni migration 003: mandatory, immutable professional phone number.
-- Apply this migration to the project's Supabase SQL editor after migrations 001 and 002.

-- Require every newly created professional profile to include a usable phone number.
create or replace function public.guard_professional_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role = 'professional' and nullif(btrim(new.phone), '') is null then
      raise exception 'Professional phone number is required';
    end if;
    if new.role = 'professional' and btrim(new.phone) !~ '^(\\+213|0)[0-9]{8,9}$' then
      raise exception 'Enter a valid Algerian phone number';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile identity and creation time are immutable';
  end if;

  if auth.uid() is not null and coalesce(auth.jwt()->>'role','') <> 'service_role' then
    if new.role is distinct from old.role or new.is_verified is distinct from old.is_verified then
      raise exception 'Changing account role or verification is not allowed';
    end if;
  end if;

  -- A professional may set a missing number once, but can never change or remove it.
  if auth.uid() = old.id and old.role = 'professional' then
    if nullif(btrim(old.phone), '') is not null and new.phone is distinct from old.phone then
      raise exception 'Professional phone number is fixed and cannot be changed';
    end if;
    if nullif(btrim(old.phone), '') is null and nullif(btrim(new.phone), '') is not null
       and btrim(new.phone) !~ '^(\\+213|0)[0-9]{8,9}$' then
      raise exception 'Enter a valid Algerian phone number';
    end if;
    if nullif(btrim(old.phone), '') is null and nullif(btrim(new.phone), '') is null then
      -- Existing legacy accounts can still edit other profile fields, but cannot publish
      -- services until they set their phone number.
      null;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
drop trigger if exists profiles_phone_guard on public.profiles;
create trigger profiles_phone_guard
before insert or update on public.profiles
for each row execute function public.guard_professional_phone();

-- Do not allow a professional to publish or submit a service without a fixed phone.
create or replace function public.require_phone_for_professional_service()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_phone text;
begin
  select p.phone into profile_phone
  from public.profiles p
  where p.id = new.professional_id and p.role = 'professional';

  if nullif(btrim(profile_phone), '') is null then
    raise exception 'Set a required professional phone number before adding a service';
  end if;
  return new;
end;
$$;

drop trigger if exists professional_service_phone_required on public.professional_services;
create trigger professional_service_phone_required
before insert or update on public.professional_services
for each row execute function public.require_phone_for_professional_service();

-- The phone number is intentionally public because the customer-facing profile has a
-- direct call button. Keep all existing safe directory columns and append phone/description.
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
  from public.service_requests sr where sr.professional_id = p.id and sr.status = 'completed'
) stats on true
where p.role = 'professional';

grant select on public.professional_directory to anon, authenticated;
