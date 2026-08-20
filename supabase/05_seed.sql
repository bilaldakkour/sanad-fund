-- ============================================================================
-- صندوق التعاضد العائلي — Seed (اختياري)
--
-- ما فينا نزرع مستخدمين تجريبيين مباشرة بـ SQL لأنه Supabase Auth بيدير جدول
-- auth.users بنفسه (باسورد hashing إلخ). المسار الصحيح:
--   1) شغّل التطبيق، سجّل أول حساب من صفحة "طلب انضمام".
--   2) رقّيه لإدمن يدويًا بالـ SQL Editor:
--        update profiles set role = 'admin', status = 'approved' where email = 'you@example.com';
--   3) بعدين من لوحة الإدمن بالتطبيق وافق على باقي طلبات الانضمام وعيّن الأدوار.
--
-- هالملف بس بيزرع حالتين طارئتين تجريبيتين (اختياري، احذفه أو عدّله متل ما بدك)
-- — لازم يكون في إدمن واحد ع الأقل مسجّل قبل ما تشغّله.
-- ============================================================================

insert into emergency_cases (title, description, status, target_amount, raised_amount, currency, created_by)
select 'علاج القلب لعمو محمود', 'دفعات علاج بالمستشفى', 'open', 1500, 800, 'USD', p.id
from profiles p where p.role = 'admin' limit 1
on conflict do nothing;

insert into emergency_cases (title, description, status, target_amount, raised_amount, currency, created_by)
select 'ترميم سقف بيت الجدّة', 'دفعة أولى للمقاول', 'open', 1000, 300, 'USD', p.id
from profiles p where p.role = 'admin' limit 1
on conflict do nothing;
