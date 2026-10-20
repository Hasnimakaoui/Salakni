-- Correct the Algerian phone regex in the immutable professional phone guard.
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
    if new.role = 'professional' and btrim(new.phone) !~ '^([+]213|0)[0-9]{8,9}$' then
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
  if auth.uid() = old.id and old.role = 'professional' then
    if nullif(btrim(old.phone), '') is not null and new.phone is distinct from old.phone then
      raise exception 'Professional phone number is fixed and cannot be changed';
    end if;
    if nullif(btrim(old.phone), '') is null and nullif(btrim(new.phone), '') is not null
       and btrim(new.phone) !~ '^([+]213|0)[0-9]{8,9}$' then
      raise exception 'Enter a valid Algerian phone number';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
