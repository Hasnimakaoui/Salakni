import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');
const viteEnv = await readFile(new URL('./vite-env.d.ts', import.meta.url), 'utf8');
const checks = [
  ['profile lookup errors are surfaced', /if\s*\(profileError\)\s*\{[\s\S]{0,160}setNotice\(/],
  ['first-login profile race is repaired', /if\s*\(!profile\)\s*\{[\s\S]{0,350}await ensureProfile\(session\.user/],
  ['profile insert errors are surfaced', /if\s*\(insertError\s*&&\s*insertError\.code\s*!==\s*'23505'\)\s*throw insertError/],
  ['demo profiles cannot create real requests', /if\s*\(!requestPro\.professionalId\)\s*throw new Error/],
  ['messages are limited to 5000 characters', /if\s*\(body\.length\s*>\s*5000\)/],
  ['account request loading errors are surfaced', /customerQuery\.error[\s\S]{0,120}setNotice\(/],
  ['private chat loading errors are surfaced', /if\s*\(error\)\s*setNotice\(`تعذر تحميل الرسائل/],
  ['admin dashboard query errors are surfaced', /failedQuery\?\.error[\s\S]{0,100}setNotice\(/],
  ['owner can edit professional phone', /saveAdminUserFull[\s\S]{0,700}phone=String\(d\.phone\|\|''\)\.trim\(\)\.replace\(\/\[\\s-\]\/g,''\)/],
  ['public directory uses restricted RPC', /rpc\('get_professional_directory'\)/],
  ['directory load errors are surfaced', /get_professional_directory'\)\.then\(\(\{ data, error \}\) => \{\s*if \(error\) \{ setNotice\(/],
  ['booking requires at least 48 hours lead time', /requestDate[\s\S]{0,160}Date\.now\(\) \+ 48 \* 60 \* 60 \* 1000/],
  ['cancellation requires a reason', /status === 'cancelled'[\s\S]{0,180}trim\(\)\.length < 5/],
  ['cancellation modal is present', /aria-label=\"إلغاء طلب الخدمة\"[\s\S]{0,500}سبب الإلغاء/],
  ['professional nickname is saved and used', /patch\.professional_name = nickname[\s\S]{0,180}professionalNickname/],
  ['professional support chat is available', /professional_support_messages[\s\S]{0,500}sendProfessionalSupportMessage/],
  ['owner support inbox is available', /admin-support-center[\s\S]{0,500}sendOwnerSupportMessage/],
  ['subscription receipts are uploaded privately', /storage\.from\('subscription-receipts'\)\.upload/],
  ['payment submission uses the configured subscription price', /amount_dzd:amount[\s\S]{0,220}subscription_payments/],
  ['owner can configure CCP and BaridiMob details', /admin-payment-settings[\s\S]{0,1200}baridimob_number/],
];
let failed = false;
for (const [label, pattern] of checks) {
  if (pattern.test(source)) console.log(`OK ${label}`);
  else { console.error(`FAIL ${label}`); failed = true; }
}
if (!/reference types=\"vite\/client\"/.test(viteEnv)) {
  console.error('FAIL Vite client type declarations are missing');
  failed = true;
} else console.log('OK Vite client type declarations');
if (failed) process.exit(1);
console.log(`Validated ${checks.length} application safeguards and Vite environment types.`);
