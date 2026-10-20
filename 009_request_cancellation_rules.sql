-- Require a reason for cancellation and allow cancellation before completion.
alter table public.service_requests
  add column if not exists cancellation_reason text;

create or replace function public.guard_service_request_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $request_guard$
begin
  if new.status = 'cancelled' and char_length(btrim(coalesce(new.cancellation_reason,''))) < 5 then
    raise exception 'A cancellation reason of at least five characters is required';
  end if;
  if old.status = 'cancelled' and new.cancellation_reason is distinct from old.cancellation_reason then
    raise exception 'Cancellation reason cannot be changed after cancellation';
  end if;
  if new.status <> 'cancelled' and new.cancellation_reason is distinct from old.cancellation_reason then
    raise exception 'Cancellation reason can only be set when cancelling a request';
  end if;

  if auth.uid() is null or coalesce(auth.jwt()->>'role','') = 'service_role' then
    new.updated_at := now();
    return new;
  end if;

  if public.is_owner() then
    new.updated_at := now();
    return new;
  end if;

  if auth.uid() = old.customer_id then
    if new.customer_id is distinct from old.customer_id
       or new.professional_id is distinct from old.professional_id
       or new.service_id is distinct from old.service_id
       or new.title is distinct from old.title
       or new.details is distinct from old.details
       or new.preferred_at is distinct from old.preferred_at then
      raise exception 'Customer cannot change request ownership or service';
    end if;
    if old.status in ('completed','cancelled') and new.status is distinct from old.status then
      raise exception 'Completed or cancelled requests cannot be cancelled again';
    end if;
    if old.status <> 'pending' and new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'Customer can only cancel a request, not change its workflow status';
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
      (old.status = 'in_progress' and new.status in ('in_progress','completed','cancelled')) or
      (old.status = new.status)
    ) then
      raise exception 'Invalid service request status transition';
    end if;
  else
    raise exception 'Not a participant in this request';
  end if;

  new.updated_at := now();
  return new;
end;
$request_guard$;

comment on column public.service_requests.cancellation_reason is
  'Required explanation when a customer, professional, or owner cancels a request.';
