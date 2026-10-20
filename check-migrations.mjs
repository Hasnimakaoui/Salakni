import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const files = [
  '001_initial_schema.sql',
  '002_audit_and_hardening.sql',
  '003_professional_phone_required.sql',
  '004_correct_professional_phone_validation.sql',
  '005_owner_full_profile_edit.sql',
  '006_secure_owner_profile_policy.sql',
  '007_owner_profile_policy_cleanup.sql',
  '008_public_directory_rpc_and_security_grants.sql',
  '009_request_cancellation_rules.sql',
  '010_directory_pro_priority.sql',
  '011_professional_nickname_support_and_receipts.sql',
  '012_subscription_payment_integrity.sql',
  '013_support_realtime.sql',
];
const required = new Map([
  ['001_initial_schema.sql', ['enable row level security', 'customers create requests', 'participants send messages', 'ensure_request_conversation']],
  ['002_audit_and_hardening.sql', ['audit_logs', 'report content and ownership are immutable', 'only staff can review reports']],
  ['003_professional_phone_required.sql', ['professional phone number is required', 'professional_service_phone_required']],
  ['004_correct_professional_phone_validation.sql', ["'^([+]213|0)[0-9]{8,9}$'"]],
  ['005_owner_full_profile_edit.sql', ['actor_is_owner', 'changing account role or verification is not allowed']],
  ['006_secure_owner_profile_policy.sql', ['owner full profile management', 'current_user_is_owner']],
  ['007_owner_profile_policy_cleanup.sql', ['public.is_owner()', 'drop function if exists public.current_user_is_owner()']],
  ['008_public_directory_rpc_and_security_grants.sql', ['get_professional_directory', 'p.subscription_active', 'p.is_verified', 'not p.is_suspended', 'revoke all on function public.guard_professional_phone() from public, anon, authenticated']],
  ['009_request_cancellation_rules.sql', ['cancellation_reason', 'at least five characters', "new.status in ('in_progress','completed','cancelled')"]],
  ['010_directory_pro_priority.sql', ['get_professional_directory', "coalesce(p.subscription_plan in ('pro_monthly','pro_yearly'), false)"]],
]);

let failed = false;
let totalTriggers = 0;
for (const name of files) {
  let sql;
  try { sql = (await readFile(resolve(process.cwd(), name), 'utf8')).toLowerCase(); }
  catch { console.error(`FAIL ${name}: migration file is missing`); failed = true; continue; }
  let fileFailed = false;
  const delimiters = new Map();
  for (const match of sql.matchAll(/\$[a-z_0-9]*\$/g)) {
    const token = match[0];
    delimiters.set(token, (delimiters.get(token) || 0) + 1);
  }
  for (const [token, count] of delimiters) {
    if (count % 2 !== 0) {
      console.error(`FAIL ${name}: unbalanced function delimiter ${token}`);
      failed = fileFailed = true;
    }
  }
  for (const fragment of required.get(name) || []) {
    if (!sql.includes(fragment.toLowerCase())) {
      console.error(`FAIL ${name}: missing required safeguard: ${fragment}`);
      failed = fileFailed = true;
    }
  }
  const triggers = new Set();
  for (const match of sql.matchAll(/create\s+trigger\s+([a-z0-9_]+)\s+(?:before|after|instead\s+of)\s+[\s\w,]+?\s+on\s+([a-z0-9_.]+)/g)) {
    const key = `${match[2]}:${match[1]}`;
    if (triggers.has(key)) {
      console.error(`FAIL ${name}: duplicate trigger ${match[1]} on ${match[2]}`);
      failed = fileFailed = true;
    }
    triggers.add(key);
    totalTriggers++;
  }
  const functionPattern = /create\s+(?:or\s+replace\s+)?function\s+([a-z0-9_.]+)[\s\S]*?\$([a-z0-9_]*)\$;/g;
  for (const match of sql.matchAll(functionPattern)) {
    const body = match[0];
    if (/security\s+definer/.test(body) && !/set\s+search_path\s*=/.test(body)) {
      console.error(`FAIL ${name}: SECURITY DEFINER function ${match[1]} must set search_path`);
      failed = fileFailed = true;
    }
  }
  if (!fileFailed) console.log(`OK ${name}`);
}
if (failed) process.exit(1);
console.log(`Validated ${files.length} migration files and ${totalTriggers} trigger definitions.`);
