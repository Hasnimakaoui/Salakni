-- Ensure Pro plans rank ahead of standard plans even when subscription_plan is NULL.
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
as $directory$
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
  order by coalesce(p.subscription_plan in ('pro_monthly','pro_yearly'), false) desc,
           coalesce(rev.average_rating, 0) desc, p.display_name asc;
$directory$;
