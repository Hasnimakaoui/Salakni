-- Salakni security hardening and moderation audit trail.
-- Apply after 001_initial_schema.sql in the dedicated Salakni Supabase project.

-- Clients must not create arbitrary private conversations. The request trigger creates
-- the customer/professional conversation server-side when a valid request is submitted.
drop policy if exists "participants create conversations" on public.conversations;

-- Prevent forged completed requests and forged staff/profile attributes on inserts.
drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles
for insert to authenticated with check (
  id = auth.uid() and role in ('customer','professional') and is_verified = false
);
drop policy if exists "customers create requests" on public.service_requests;
create policy "customers create requests" on public.service_requests
for insert to authenticated with check (
  customer_id = auth.uid() and status = 'pending'
  and professional_id <> auth.uid()
  and exists (select 1 from public.profiles p where p.id = professional_id and p.role = 'professional')
  and (service_id is null or exists (
    select 1 from public.professional_services s
    where s.id = service_id and s.professional_id = professional_id and s.is_active
  ))
);
drop policy if exists "users create reports" on public.reports;
create policy "users create reports" on public.reports
for insert to authenticated with check (
  reporter_id = auth.uid() and status = 'open' and reviewed_by is null
);

-- Make account identity/authorization fields server-controlled, and maintain updated_at.
create or replace function public.prevent_profile_role_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile identity and creation time are immutable';
  end if;
  if auth.uid() is not null and coalesce(auth.jwt()->>'role','') <> 'service_role' then
    if new.role is distinct from old.role or new.is_verified is distinct from old.is_verified then
      raise exception 'Changing account role or verification is not allowed';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 100),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);
alter table public.audit_logs enable row level security;

drop policy if exists "staff read audit logs" on public.audit_logs;
create policy "staff read audit logs" on public.audit_logs
for select to authenticated using (public.is_moderator_or_owner());
-- Deliberately no client INSERT/UPDATE/DELETE policy. Entries are trigger-generated only.

create or replace function public.write_audit_log(
  p_action text, p_entity_type text, p_entity_id text, p_details jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb));
end;
$$;
revoke all on function public.write_audit_log(text,text,text,jsonb) from public;
revoke all on function public.write_audit_log(text,text,text,jsonb) from anon, authenticated;

create or replace function public.audit_service_request_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    perform public.write_audit_log(
      'request_status_changed', 'service_request', new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;
drop trigger if exists service_request_status_audit on public.service_requests;
create trigger service_request_status_audit
after update on public.service_requests
for each row execute function public.audit_service_request_status();

-- A reviewer can change only a report's status; reporter, target, reason, and creation
-- timestamp are immutable. reviewed_by is set from the authenticated reviewer.
create or replace function public.guard_report_review_updates()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.reporter_id is distinct from old.reporter_id
    or new.reported_profile_id is distinct from old.reported_profile_id
    or new.request_id is distinct from old.request_id
    or new.reason is distinct from old.reason
    or new.created_at is distinct from old.created_at then
    raise exception 'Report content and ownership are immutable';
  end if;
  if auth.uid() is not null and coalesce(auth.jwt()->>'role','') <> 'service_role'
     and not public.is_moderator_or_owner() then
    raise exception 'Only staff can review reports';
  end if;
  if new.status is distinct from old.status then
    if new.status not in ('reviewing','resolved','dismissed') then
      raise exception 'Invalid report status';
    end if;
    new.reviewed_by := auth.uid();
  else
    new.reviewed_by := old.reviewed_by;
  end if;
  return new;
end;
$$;
drop trigger if exists reports_review_guard on public.reports;
create trigger reports_review_guard before update on public.reports
for each row execute function public.guard_report_review_updates();

create or replace function public.audit_report_review()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    perform public.write_audit_log(
      'report_status_changed', 'report', new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status, 'reviewed_by', new.reviewed_by)
    );
  end if;
  return new;
end;
$$;
drop trigger if exists report_status_audit on public.reports;
create trigger report_status_audit
after update on public.reports
for each row execute function public.audit_report_review();

comment on table public.audit_logs is 'Append-only audit trail for moderation and service workflow status changes.';

create or replace function public.guard_service_request_identity()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Request identity and creation time are immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists service_request_identity_guard on public.service_requests;
create trigger service_request_identity_guard
before update on public.service_requests
for each row execute function public.guard_service_request_identity();
