import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const workflow = readFileSync('.github/workflows/android-build.yml', 'utf8');
const required = [
  ['manual build trigger', /workflow_dispatch:/],
  ['push build trigger for main', /push:\s*\n\s*branches:\s*\[main\]/],
  ['Node setup', /uses:\s*actions\/setup-node@v4/],
  ['Java setup', /uses:\s*actions\/setup-java@v4/],
  ['Android SDK setup', /uses:\s*android-actions\/setup-android@v3/],
  ['project checks before build', /npm run check/],
  ['web production build', /npm run build/],
  ['Capacitor Android project generation', /npx cap add android/],
  ['Capacitor Android sync', /npx cap sync android/],
  ['APK assembly', /assembleDebug/],
  ['APK existence validation', /test -s android\/app\/build\/outputs\/apk\/debug\/app-debug\.apk/],
  ['APK artifact upload', /uses:\s*actions\/upload-artifact@v4/],
  ['artifact path', /path:\s*android\/app\/build\/outputs\/apk\/debug\/app-debug\.apk/],
  ['release publishing step', /uses:\s*softprops\/action-gh-release@v2/],
  ['release has APK file', /files:\s*android\/app\/build\/outputs\/apk\/debug\/app-debug\.apk/],
  ['release write permission', /contents:\s*write/],
  ['fail if APK missing', /if-no-files-found:\s*error/],
  ['Supabase URL supplied from secret', /VITE_SUPABASE_URL:\s*\$\{\{\s*secrets\.VITE_SUPABASE_URL\s*\}\}/],
  ['Supabase public key supplied from secret', /VITE_SUPABASE_ANON_KEY:\s*\$\{\{\s*secrets\.VITE_SUPABASE_ANON_KEY\s*\}\}/],
];
for (const [label, pattern] of required) {
  assert.match(workflow, pattern, `Missing workflow requirement: ${label}`);
  console.log(`OK ${label}`);
}
const checks = workflow.indexOf('npm run check');
const build = workflow.indexOf('npm run build');
const apk = workflow.indexOf('assembleDebug');
const verify = workflow.indexOf('test -s android/app/build/outputs/apk/debug/app-debug.apk');
const upload = workflow.indexOf('actions/upload-artifact@v4');
assert.ok(checks < build && build < apk && apk < verify && verify < upload,
  'Workflow steps must run checks, web build, APK assembly, APK verification, then artifact upload in order');
console.log(`Validated ${required.length} Android workflow requirements and step ordering.`);
