# سلكني — Salakni

مشروع مستقل لمنصة خدمات جزائرية تربط الزبائن بالحرفيين. الواجهة عربية RTL ومصممة للهاتف باستخدام React وVite وCapacitor، مع Supabase للمصادقة والبيانات.

## Repair pass — 2026-10-14

- Fixed a first-login race where Supabase auth state could load before the matching profile row, causing new professional accounts to appear as customers until a reload.
- Profile lookup/creation errors now surface to the user instead of being silently ignored; duplicate-key races are handled safely.
- Added `npm run check:app` regression checks for first-login profile recovery, visible database errors, and key message/request safeguards; `npm run check` runs app and SQL checks together.
- Strengthened `npm run check:migrations` to detect duplicate trigger definitions and `SECURITY DEFINER` functions without a pinned `search_path`; Android CI now runs the combined checks before building. Added `npm run check:workflow` to verify that the cloud workflow has the expected triggers, configuration, APK verification, and artifact upload in the correct order.
- These checks are static. Apply the SQL migrations to the dedicated Salakni Supabase project and complete a dependency-backed build before release.

## الوظائف الموجودة في الشيفرة
- البحث والتصفية حسب المهنة والمنطقة، وقائمة مفضلة محفوظة على الجهاز.
- تعديل الاسم الظاهر والنبذة الشخصية من صفحة الحساب.
- إنشاء حساب وتسجيل الدخول بالبريد وكلمة المرور واستعادة كلمة المرور عبر Supabase Auth.
- نوعا حساب: زبون وحرفي؛ لا يستطيع المستخدم ترقية نفسه إلى مالك أو تغيير حالة التوثيق من العميل.
- نشر خدمة حرفية وعرض الخدمات النشطة في الدليل العام.
- إرسال طلب خدمة، مع موعد مفضّل وتفاصيل، وعرض طلبات الزبون.
- للحرفي: عرض الطلبات الواردة وتحديث الحالة ضمن المسار المسموح.
- تقييم الخدمة بعد إتمام الطلب.
- إرسال بلاغ عن ملف حرفي، ولوحة أولية للمشرف/المالك لمراجعة البلاغات المفتوحة وعرض إحصاءات أساسية.
- محادثات خاصة ورسائل نصية مع تحديثات Realtime عند تفعيل Supabase Realtime.
- مخطط SQL للجداول وسياسات RLS وحماية انتقالات الطلبات؛ محادثة خاصة تُنشأ تلقائيًا مع الطلب الصحيح.
- سجل تدقيق آلي لتغييرات حالات الطلبات والبلاغات، مع حماية محتوى البلاغ ومنع إنشاء محادثات عشوائية من العميل.
- سير GitHub Actions لبناء APK تجريبي مع فحص وجود الملف قبل رفعه كملف artifact، وإعداد Android SDK وJava وNode تلقائيًا.

## إعداد Supabase
1. أنشئ مشروع Supabase مخصصًا لسلكني.
2. نفّذ ملفات SQL بالترتيب في SQL Editor: `supabase/migrations/001_initial_schema.sql` ثم `supabase/migrations/002_audit_and_hardening.sql`.
3. للبناء على GitHub Actions، أضف أسرار المستودع `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` من إعدادات المشروع. هذه قيم عميل عامة فقط؛ لا تستخدم `service_role`.
4. لا تضع `service_role` داخل التطبيق. عيّن دور المالك من عملية إدارية موثوقة، لا من واجهة المستخدم.

## التشغيل والبناء
- يتطلب Node.js 20 أو أحدث.
- `npm install`
- `npm run dev` لتشغيل الواجهة في المتصفح.
- `npm run build` لبناء الواجهة.
- بعد وجود ملفات المشروع في مستودع GitHub، يعمل workflow **Android build** عند الدفع إلى `main` أو عند تشغيله يدويًا. بعد نجاحه، نزّل artifact باسم `salakni-debug-apk`.

## ما لم يكتمل بعد
هذه نسخة تطوير وليست إصدارًا إنتاجيًا. بطاقات الحرفيين الظاهرة قبل تهيئة Supabase بيانات تجريبية. يلزم تطبيق ملفي SQL في مشروع Supabase المخصص واختبار RLS بحسابات منفصلة، إعداد رابط استعادة كلمة المرور في Supabase، مراجعة إعدادات البريد، واختبار البناء على GitHub Actions. لم يُختبر بناء APK محليًا في هذه البيئة لأن تنزيل حزم npm انتهى بمهلة اتصال. لم تُنفذ بعد لوحة مالك كاملة، رفع الصور، الإشعارات، التحقق من الهوية، الدفع، أو مكالمات الصوت والفيديو.

## Android cloud build

The GitHub Actions workflow at `.github/workflows/android-build.yml` runs on pushes to `main` and can also be started manually from the repository's Actions tab. It runs the repository checks, builds the Vite app, creates the Capacitor Android project, assembles a debug APK, verifies the APK exists, and uploads it as the `salakni-debug-apk` workflow artifact for 14 days.

For a connected app build, configure the repository Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the project's Supabase URL and public anon/publishable key. If either is missing, the workflow warns and may produce an APK without backend connectivity.

This ZIP contains source code and a cloud-build workflow; it is not itself an APK.

## Android APK delivery

The GitHub Actions workflow builds `android/app/build/outputs/apk/debug/app-debug.apk`, uploads it as a short-lived workflow artifact, and publishes the same APK as a GitHub Release named `android-N`. The release is the stable shareable download URL; workflow artifacts expire after 14 days. The workflow requires repository Actions to be enabled and the workflow token to have `contents: write` permission. Configure the Supabase project URL and publishable/anon key as repository Actions secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before expecting backend-connected builds.
