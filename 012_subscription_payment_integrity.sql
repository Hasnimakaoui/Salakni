-- 012: enforce subscription payment integrity in the database, not just in the UI.
create or replace function public.validate_subscription_payment_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $payment_guard$
declare
  actual_role public.app_role;
  expected_amount integer;
  expected_key text;
begin
  if tg_op = 'UPDATE' then
    if public.is_moderator_or_owner() then return new; end if;
    raise exception 'Subscription payment requests cannot be edited by clients';
  end if;
  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception 'A user may only submit their own subscription payment';
  end if;
  select role into actual_role from public.profiles where id=auth.uid();
  if actual_role is null or actual_role not in ('customer','professional') or new.account_type <> actual_role then
    raise exception 'Subscription account type does not match the signed-in profile';
  end if;
  if new.plan_code not in ('monthly','pro_monthly','pro_yearly') then
    raise exception 'Unsupported subscription plan';
  end if;
  if actual_role='customer' and new.plan_code <> 'monthly' then
    raise exception 'Pro subscriptions are only available to professional accounts';
  end if;
  expected_key := case new.plan_code
    when 'monthly' then 'price_monthly'
    when 'pro_monthly' then 'price_pro_monthly'
    when 'pro_yearly' then 'price_pro_yearly'
  end;
  select nullif(value #>> '{}','')::integer into expected_amount
  from public.app_settings where key=expected_key;
  if expected_amount is null or expected_amount < 1 or new.amount_dzd <> expected_amount then
    raise exception 'Subscription amount does not match the current official price';
  end if;
  if char_length(btrim(coalesce(new.transfer_reference,''))) < 4
     or char_length(btrim(new.transfer_reference)) > 120 then
    raise exception 'A valid transfer reference is required';
  end if;
  if new.receipt_path is null or (storage.foldername(new.receipt_path))[1] <> auth.uid()::text then
    raise exception 'A private receipt uploaded to your own account folder is required';
  end if;
  if new.status <> 'pending' or new.reviewed_at is not null or new.reviewed_by is not null
     or new.subscription_starts_at is not null or new.subscription_ends_at is not null or new.admin_note is not null then
    raise exception 'A new payment request must remain pending until owner review';
  end if;
  if exists(select 1 from public.subscription_payments p where p.user_id=new.user_id and p.status='pending') then
    raise exception 'You already have a subscription payment awaiting review';
  end if;
  new.transfer_reference := btrim(new.transfer_reference);
  return new;
end;
$payment_guard$;

drop trigger if exists validate_subscription_payment_submission on public.subscription_payments;
create trigger validate_subscription_payment_submission
before insert or update on public.subscription_payments
for each row execute function public.validate_subscription_payment_submission();
revoke all on function public.validate_subscription_payment_submission() from public, anon, authenticated;
