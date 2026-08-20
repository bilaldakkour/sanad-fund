# سَنَد — صندوق التعاضد العائلي

Next.js 16 (App Router) + Supabase (Postgres + Auth + RLS). التصميم منقول 1:1 من
`family-fund-prototype.jsx` (سلايت/برتقالي، RTL، بطاقات، bottom nav)، والمواصفات من
`صندوق-التعاضد-العائلي-برومبت.md`.

## 1) إنشاء مشروع Supabase

1. روح [supabase.com](https://supabase.com) → New Project (مجاني).
2. لما يخلص الإنشاء، من **Project Settings → API** خذ:
   - `Project URL`
   - `anon public` key

## 2) تطبيق قاعدة البيانات

بـ **SQL Editor** بمشروع Supabase، شغّل ملفات `supabase/*.sql` **بالترتيب**:

1. `supabase/01_schema.sql` — الجداول
2. `supabase/02_functions.sql` — الدوال + trigger إنشاء profile تلقائي
3. `supabase/03_policies.sql` — Row Level Security
4. `supabase/04_views.sql` — `donations_feed` (إخفاء المبالغ)، `expenses_feed`، `fund_balances`، `monthly_donation_totals`
5. `supabase/05_seed.sql` — اختياري (حالتين طارئتين تجريبيتين)، شغّله بس بعد ما يصير عندك إدمن (خطوة 4 تحت)

## 3) ربط المشروع

انسخ `.env.local.example` إلى `.env.local` وعبّي القيم:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> بـ **Authentication → Providers → Email** بمشروع Supabase، لو بدك تجرب بسرعة بدون تفعيل
> إيميلات تأكيد، فيك تعطّل "Confirm email". غير هيك المستخدم لازم يأكد إيميله قبل ما يقدر
> يسجل دخول حتى لو صار "موافق عليه" بالتطبيق.

## 4) تشغيل المشروع وإنشاء أول إدمن

```bash
npm install
npm run dev
```

1. افتح [http://localhost:3000](http://localhost:3000) → "اطلب انضمام" وسجّل أول حساب.
2. رقّيه لإدمن من SQL Editor:
   ```sql
   update profiles set role = 'admin', status = 'approved' where email = 'you@example.com';
   ```
3. سجّل دخول — رح تشوف كل اللوحات (بما فيها "الإعدادات"). من تبويب "حسابي" فيك توافق على
   طلبات الانضمام الجاية وتعيّن أدوار (أمين صندوق / مشرف / جابي أموال) لباقي أفراد العيلة.

## البنية

- `src/app/(app)/` — الصفحات المحمية (الرئيسية، السجل، الحالات، حسابي، الموافقات، الإعدادات) خلف تحقق `status='approved'`.
- `src/app/login`, `register`, `pending` — تدفق تسجيل الدخول/الانضمام العام.
- `src/app/actions/` — Server Actions (كل الكتابة تمر من هون، RLS بتتحقق تاني مرة بقاعدة البيانات).
- `src/lib/supabase/` — عملاء Supabase (browser/server) + منطق الـ proxy (middleware) لتحديث الجلسة.
- `supabase/*.sql` — Schema + Functions + RLS + Views، بالترتيب المرقّم.

## قرارات أمان مهمة (انظر تعليقات SQL للتفصيل)

- **لا service role key بالتطبيق إطلاقاً** — كل عملية حسّاسة (موافقة عضو، موافقة مزدوجة على
  مصروف مع حساب الرصيد) تمر عبر دوال Postgres بصلاحية `SECURITY DEFINER` تتحقق من دور
  المستخدم بنفسها.
- **إخفاء مبالغ التبرعات** (`hide_amounts` بالإعدادات) منطبّق داخل الـ view
  `donations_feed` بالـ SQL نفسه — مو مجرد إخفاء بالواجهة.
- **DELETE ممنوع نهائيًا** على `donations`/`expenses` — أي تصحيح غلط بيصير تعديل
  (`edited=true`) مو حذف، فيضل الأثر الكامل ظاهر للجميع (Audit Trail).

## اللي لسا لازم تعمله بنفسك

- نشر المشروع (Vercel مثلاً) وربط نفس متغيرات البيئة.
- لو بدك تصدير PDF/Excel للسجل (مذكور بالمواصفات كميزة اختيارية لمرحلة لاحقة) — مو منفّذة بعد.
- إشعارات بريد إلكتروني للإدمن عند طلب انضمام جديد — مو منفّذة بعد (اختيارية بالمواصفات).
