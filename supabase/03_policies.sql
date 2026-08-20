-- ============================================================================
-- صندوق التعاضد العائلي — Row Level Security
-- شغّل هذا الملف بعد 02_functions.sql.
--
-- المبدأ العام:
--   - SELECT: للأعضاء الموافق عليهم فقط (transparency).
--   - INSERT/UPDATE: حسب الدور (انظر كل جدول تحت).
--   - DELETE: ممنوع نهائيًا على donations/expenses — لا توجد أي DELETE policy،
--     وبالإضافة REVOKE صريح لصلاحية DELETE (audit trail كامل، تصحيح = تعديل لا حذف).
--   - تغييرات profiles.role/status وموافقات expenses تمر حصرًا عبر SECURITY DEFINER
--     RPCs (02_functions.sql) — ما في أي UPDATE policy مباشر عليهم.
-- ============================================================================

alter table profiles enable row level security;
alter table currencies enable row level security;
alter table fund_settings enable row level security;
alter table emergency_cases enable row level security;
alter table donations enable row level security;
alter table expenses enable row level security;
alter table notifications enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (status = 'approved' or id = auth.uid() or is_admin());

-- لا INSERT policy: صف profiles يُنشأ فقط عبر trigger handle_new_user (security definer).
-- لا UPDATE policy: role/status يتغيرو فقط عبر approve_member / reject_member / set_member_role.
-- لا DELETE policy.

-- ----------------------------------------------------------------------------
-- currencies
-- ----------------------------------------------------------------------------
drop policy if exists currencies_select on currencies;
create policy currencies_select on currencies for select
  using (is_approved());

drop policy if exists currencies_insert on currencies;
create policy currencies_insert on currencies for insert
  with check (is_admin());

drop policy if exists currencies_update on currencies;
create policy currencies_update on currencies for update
  using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- fund_settings
-- ----------------------------------------------------------------------------
drop policy if exists fund_settings_select on fund_settings;
create policy fund_settings_select on fund_settings for select
  using (is_approved());

drop policy if exists fund_settings_update on fund_settings;
create policy fund_settings_update on fund_settings for update
  using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- emergency_cases
-- ----------------------------------------------------------------------------
drop policy if exists cases_select on emergency_cases;
create policy cases_select on emergency_cases for select
  using (is_approved());

drop policy if exists cases_insert on emergency_cases;
create policy cases_insert on emergency_cases for insert
  with check (is_admin());

drop policy if exists cases_update on emergency_cases;
create policy cases_update on emergency_cases for update
  using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- donations
--
-- مهم: الجدول الأساسي هون قاصد يكون طبقة دفاع ثانية بس — مسار القراءة الآمن
-- الحقيقي (اللي فيه إخفاء المبالغ) هو الـ view `donations_feed` بملف 04_views.sql،
-- يلي بيطبّق منطق الإخفاء داخل الـ SQL نفسه بغض النظر عن هالـ policy. هالـ policy
-- هون بس بتسمح لصاحب التبرع/يلي سجّله/يلي قبضه أو الأدوار كاملة-الصلاحية يشوفو
-- الصف مباشرة من الجدول (مفيد متل وقت الـ insert().select() من الفورم).
-- ----------------------------------------------------------------------------
drop policy if exists donations_select on donations;
create policy donations_select on donations for select
  using (
    is_approved() and (
      member_id = auth.uid()
      or recorded_by = auth.uid()
      or collected_by = auth.uid()
      or is_full_visibility_role()
    )
  );

drop policy if exists donations_insert on donations;
create policy donations_insert on donations for insert
  with check (current_profile_role() in ('admin', 'treasurer', 'collector'));

drop policy if exists donations_update on donations;
create policy donations_update on donations for update
  using (current_profile_role() in ('admin', 'treasurer', 'collector'))
  with check (current_profile_role() in ('admin', 'treasurer', 'collector'));

revoke delete on donations from authenticated;

-- ----------------------------------------------------------------------------
-- expenses (المبالغ ما بتنخفى أبدًا هون — فقط التبرعات إلها خصوصية)
-- ----------------------------------------------------------------------------
drop policy if exists expenses_select on expenses;
create policy expenses_select on expenses for select
  using (is_approved());

drop policy if exists expenses_insert on expenses;
create policy expenses_insert on expenses for insert
  with check (current_profile_role() = 'admin');

-- لا UPDATE policy: الموافقات تمر حصرًا عبر approve_expense() RPC.

revoke delete on expenses from authenticated;

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications for select
  using (is_approved());

-- لا INSERT/UPDATE/DELETE policy: تُنشأ فقط من داخل approve_expense().
