-- Owner can fully edit any profile, including phone and protected fields.
create or replace function public.prevent_profile_role_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and coalesce(auth.jwt()->>'role','') <> 'service_role'
     and not exists (select 1 from public.profiles actor where actor.id = auth.uid() and actor.role = 'owner') then
    if new.role is distinct from old.role or new.is_verified is distinct from old.is_verified then
      raise exception 'Changing account role or verification is not allowed';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_professional_phone()
returns trigger language plpgsql security definer set search_path = public
as $$
declare actor_is_owner boolean := false;
begin
  if auth.uid() is not null then
    select exists(select 1 from public.profiles actor where actor.id=auth.uid() and actor.role='owner') into actor_is_owner;
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
  if auth.uid() = old.id and old.role = 'professional' and not actor_is_owner then
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

drop policy if exists "owner full profile management" on public.profiles;
create policy "owner full profile management" on public.profiles
for all to authenticated
using (exists (select 1 from public.profiles actor where actor.id=auth.uid() and actor.role='owner'))
with check (exists (select 1 from public.profiles actor where actor.id=auth.uid() and actor.role='owner'));
