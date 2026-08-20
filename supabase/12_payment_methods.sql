-- ============================================================================
-- صندوق التعاضد العائلي — طرق الدفع (تسليم يدوي، تحويلات خارجية)
-- شغّل هذا الملف بعد 11_notification_reads.sql. آمن على مشروع فيه بيانات مسجّلة أصلاً.
-- ============================================================================

create table if not exists payment_methods (
  code text primary key,
  name_ar text not null,
  name_en text not null,
  instructions_ar text,
  instructions_en text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

alter table payment_methods enable row level security;

drop policy if exists payment_methods_select on payment_methods;
create policy payment_methods_select on payment_methods for select
  using (is_approved());

drop policy if exists payment_methods_insert on payment_methods;
create policy payment_methods_insert on payment_methods for insert
  with check (is_admin());

drop policy if exists payment_methods_update on payment_methods;
create policy payment_methods_update on payment_methods for update
  using (is_admin()) with check (is_admin());

revoke delete on payment_methods from authenticated;

-- "تسليم يدوي للجابي" هي الطريقة الافتراضية الثابتة — الإدمن يضيف عليها
-- Western Union / PayPal / حوالة بنكية... إلخ من صفحة الإعدادات.
insert into payment_methods (code, name_ar, name_en, is_active, sort_order)
values ('collector', 'تسليم يدوي للجابي', 'Hand to collector', true, 0)
on conflict (code) do nothing;
