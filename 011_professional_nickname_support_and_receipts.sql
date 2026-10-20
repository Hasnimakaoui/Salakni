-- 011: professional public nickname, owner support inbox, and receipt-backed Algerian subscriptions.
alter table public.profiles add column if not exists professional_name text;
alter table public.profiles add constraint professional_name_length
  check (professional_name is null or char_length(btrim(professional_name)) between 2 and 60);

create table if not exists public.professional_support_messages (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists professional_support_thread_idx
  on public.professional_support_messages(professional_id, created_at);
alter table public.professional_support_messages enable row level security;
drop policy if exists "professional and owner read support messages" on public.professional_support_messages;
create policy "professional and owner read support messages"
on public.professional_support_messages for select to authenticated
using (professional_id = auth.uid() or public.is_owner());
drop policy if exists "professional and owner send support messages" on public.professional_support_messages;
create policy "professional and owner send support messages"
on public.professional_support_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and (
    (professional_id = auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='professional'))
    or public.is_owner()
  )
);
drop policy if exists "owner marks support messages read" on public.professional_support_messages;
create policy "owner marks support messages read"
on public.professional_support_messages for update to authenticated
using (public.is_owner()) with check (public.is_owner());

-- A private bucket stores payment proofs; the receipt_path is a bucket-relative object path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('subscription-receipts', 'subscription-receipts', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false, file_size_limit=5242880,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];
drop policy if exists "users upload own subscription receipt" on storage.objects;
create policy "users upload own subscription receipt" on storage.objects
for insert to authenticated
with check (bucket_id='subscription-receipts' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "users read own subscription receipt" on storage.objects;
create policy "users read own subscription receipt" on storage.objects
for select to authenticated
using (bucket_id='subscription-receipts' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_owner() or public.is_moderator_or_owner()));
drop policy if exists "users replace own subscription receipt" on storage.objects;
create policy "users replace own subscription receipt" on storage.objects
for update to authenticated
using (bucket_id='subscription-receipts' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='subscription-receipts' and (storage.foldername(name))[1]=auth.uid()::text);

-- Keep all prices and transfer instructions owner-configurable; seed safe defaults only if absent.
insert into public.app_settings(key,value) values
 ('price_monthly','1000'::jsonb),
 ('price_pro_monthly','1500'::jsonb),
 ('price_pro_yearly','13000'::jsonb),
 ('ccp_account','""'::jsonb),
 ('ccp_account_name','""'::jsonb),
 ('baridimob_number','""'::jsonb),
 ('baridimob_account_name','""'::jsonb),
 ('payment_instructions','"حوّل المبلغ إلى الحساب الموضح، ثم ارفع صورة أو PDF للإيصال وأدخل رقم العملية. لا يتفعّل الاشتراك إلا بعد مراجعة المالك." '::jsonb)
on conflict (key) do nothing;

create or replace function public.get_professional_directory()
returns table (
  professional_id uuid, display_name text, city text, wilaya text, bio text,
  avatar_url text, is_verified boolean, service_id uuid, service_title text,
  category text, starting_price_dzd integer, average_rating numeric,
  completed_jobs integer, description text, phone text
)
language sql stable security definer set search_path = public
as $directory$
  select p.id, coalesce(nullif(btrim(p.professional_name),''),p.display_name),
         coalesce(p.city,''), coalesce(p.wilaya,''), p.bio, p.avatar_url, p.is_verified,
         s.id, s.title, s.category, s.starting_price_dzd,
         coalesce(rev.average_rating,0)::numeric(3,1), coalesce(stats.completed_jobs,0)::integer,
         s.description, p.phone
  from public.profiles p
  join public.professional_services s on s.professional_id=p.id and s.is_active
  left join lateral (select avg(r.rating) average_rating from public.reviews r where r.professional_id=p.id) rev on true
  left join lateral (select count(*) completed_jobs from public.service_requests sr where sr.professional_id=p.id and sr.status='completed') stats on true
  where p.role='professional' and p.is_verified and p.subscription_active
    and (p.subscription_ends_at is null or p.subscription_ends_at>now()) and not p.is_suspended
  order by coalesce(p.subscription_plan in ('pro_monthly','pro_yearly'),false) desc,
           coalesce(rev.average_rating,0) desc, p.display_name asc;
$directory$;
revoke all on function public.get_professional_directory() from public, anon, authenticated;
grant execute on function public.get_professional_directory() to anon, authenticated;
