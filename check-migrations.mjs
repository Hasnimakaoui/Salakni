import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'supabase/migrations');
const files = ['001_initial_schema.sql', '002_audit_and_hardening.sql'];
const required = new Map([
  ['001_initial_schema.sql', [
    'enable row level security',
    'prevent_profile_role_escalation',
    'guard_service_request_updates',
    'ensure_request_conversation',
    'messages read by conversation participants',
    'participants send messages',
    'customers create requests',
    'service_request_update_guard',
    'staff update reports',
  ]],
  ['002_audit_and_hardening.sql', [
    'status = \'pending\'',
    'is_verified = false',
    'reviewed_by is null',
    'audit_logs',
    'guard_report_review_updates',
    'guard_service_request_identity',
    'drop policy if exists "participants create conversations"',
    'prevent_profile_role_escalation',
    'changing account role or verification is not allowed',
    'report content and ownership are immutable',
    'only staff can review reports',
    'service_request_status_audit',
    'report_status_audit',
  ]],
]);

let failed = false;
const triggerOwners = new Map();
for (const name of files) {
  const sql = (await readFile(resolve(root, name), 'utf8')).toLowerCase();
  let fileFailed = false;
  if ((sql.match(/\$\$/g) ?? []).length % 2 !== 0) {
    console.error(`FAIL ${name}: unbalanced $$ function delimiters`);
    failed = fileFailed = true;
  }
  for (const fragment of required.get(name) ?? []) {
    if (!sql.includes(fragment.toLowerCase())) {
      console.error(`FAIL ${name}: missing required safeguard: ${fragment}`);
      failed = fileFailed = true;
    }
  }
  // Catch accidental duplicate CREATE TRIGGER statements for the same table,
  // which can make a migration fail even when the SQL text looks well formed.
  for (const match of sql.matchAll(/create\s+trigger\s+([a-z0-9_]+)\s+(?:before|after|instead\s+of)\s+[\s\w,]+?\s+on\s+([a-z0-9_.]+)/g)) {
    const key = `${match[2]}:${match[1]}`;
    if (triggerOwners.has(key)) {
      console.error(`FAIL ${name}: duplicate trigger ${match[1]} on ${match[2]} (also in ${triggerOwners.get(key)})`);
      failed = fileFailed = true;
    } else triggerOwners.set(key, name);
  }
  // SECURITY DEFINER functions must pin search_path to avoid object-shadowing risks.
  for (const match of sql.matchAll(/create\s+or\s+replace\s+function\s+([a-z0-9_.]+)[\s\S]*?\$\$;/g)) {
    if (/security\s+definer/.test(match[0]) && !/set\s+search_path\s*=/.test(match[0])) {
      console.error(`FAIL ${name}: SECURITY DEFINER function ${match[1]} must set search_path`);
      failed = fileFailed = true;
    }
  }
  // Guard against accidentally weakening key authorization rules during future edits.
  if (name === '001_initial_schema.sql') {
    const mustKeep = [
      [/customer_id\s*=\s*auth\.uid\(\)/, 'request ownership must match auth.uid()'],
      [/sender_id\s*=\s*auth\.uid\(\)/, 'message sender must match auth.uid()'],
      [/professional_id\s*<>\s*auth\.uid\(\)/, 'users cannot request their own service'],
      [/status\s*=\s*'pending'/, 'new requests must start pending'],
    ];
    for (const [pattern, label] of mustKeep) {
      if (!pattern.test(sql)) {
        console.error(`FAIL ${name}: missing authorization invariant: ${label}`);
        failed = fileFailed = true;
      }
    }
  }
  if (name === '002_audit_and_hardening.sql' && !/drop\s+policy\s+if\s+exists\s+\"participants create conversations\"/i.test(sql)) {
    console.error(`FAIL ${name}: clients must not create arbitrary private conversations`);
    failed = fileFailed = true;
  }
  if (!fileFailed) console.log(`OK ${name}`);
}
if (failed) process.exit(1);
console.log(`Validated ${files.length} SQL migration files and ${triggerOwners.size} trigger definitions.`);
