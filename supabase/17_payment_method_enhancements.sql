-- ============================================================================
-- صندوق التعاضد العائلي — تحسينات طرق الدفع: شعار لكل طريقة، نسبة خصم تحويل
-- (رسوم Western Union/Whish...)، رقم حساب قابل للنسخ، وتتبّع المبلغ الصافي.
-- شغّل هذا الملف بعد 16_treasurer_only_confirmation.sql. آمن على مشروع فيه
-- بيانات مسجّلة أصلاً (كله additive، ما في أي حذف).
-- ============================================================================

alter table payment_methods add column if not exists icon_path text;
alter table payment_methods add column if not exists account_number text;
alter table payment_methods add column if not exists fee_percent numeric not null default 0
  check (fee_percent >= 0 and fee_percent < 100);

-- gross_amount: المبلغ الذي حوّله المتبرع فعليًا (قبل خصم رسوم التحويل).
-- donations.amount يضل يمثّل الصافي يلي بيدخل فعليًا عالصندوق (نفس المنطق
-- المستخدم بكل حسابات الرصيد) — الفرق بينهم هو رسوم التحويل، بيتحسب تلقائيًا
-- بالـ trigger تحت حسب fee_percent لطريقة الدفع وقت التسجيل، وبيضل ثابت حتى
-- لو تغيّرت نسبة الخصم لاحقًا (تماشيًا مع مبدأ "لا تعديل رجعي على حركات قديمة").
alter table donations add column if not exists gross_amount numeric;

-- ----------------------------------------------------------------------------
-- Storage bucket لشعارات طرق الدفع — عام (شعارات، مش معلومات حساسة)، الإدمن
-- بس يقدر يرفع/يعدّل.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-method-icons',
  'payment-method-icons',
  true,
  2097152, -- 2MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types,
    public = true;

drop policy if exists payment_method_icons_insert on storage.objects;
create policy payment_method_icons_insert on storage.objects for insert
  with check (bucket_id = 'payment-method-icons' and is_admin());

drop policy if exists payment_method_icons_update on storage.objects;
create policy payment_method_icons_update on storage.objects for update
  using (bucket_id = 'payment-method-icons' and is_admin())
  with check (bucket_id = 'payment-method-icons' and is_admin());

-- SELECT عام (public bucket) — ما منحتاج policy، Storage بيخدم ملفات
-- الـ public buckets مباشرة بدون ما يمر بـ RLS.

-- ----------------------------------------------------------------------------
-- set_donation_initial_status: إضافة حساب gross_amount / الصافي بعد خصم رسوم
-- طريقة الدفع (إذا محددة)، بالإضافة لمنطق التأكيد الموجود أصلاً (16).
-- ----------------------------------------------------------------------------
create or replace function set_donation_initial_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recorder_role text;
  fee numeric;
begin
  if new.payment_method_code is not null then
    select fee_percent into fee from payment_methods where code = new.payment_method_code;
    new.gross_amount := new.amount;
    if fee is not null and fee > 0 then
      new.amount := round(new.amount * (1 - fee / 100.0), 2);
    end if;
  end if;

  select role into recorder_role from profiles where id = new.recorded_by;

  if recorder_role = 'treasurer' then
    new.status := 'confirmed';
    new.confirmed_by := new.recorded_by;
    new.confirmed_at := now();
  else
    new.status := 'pending';
    new.confirmed_by := null;
    new.confirmed_at := null;
  end if;

  return new;
end;
$$;

-- ملاحظة: CREATE OR REPLACE VIEW بـ Postgres بيسمح فقط بإضافة أعمدة بآخر
-- قائمة SELECT — مش بمنتصفها (بيعتبرها rename لعمود موجود ويرفض). فلهيك
-- gross_amount و payment_method_fee_percent مضافين بالآخر، مش بمكانهم
-- "المنطقي" جنب amount/payment_method_name_en.
create or replace view donations_feed as
select
  d.id,
  d.entry_no,
  d.member_id,
  mp.full_name as member_name,
  case
    when is_full_visibility_role() or d.member_id = auth.uid() or not fs.hide_amounts
      then d.amount
    else null
  end as amount,
  d.currency,
  d.exchange_rate,
  d.collected_by,
  cp.full_name as collected_by_name,
  d.recorded_by,
  rp.full_name as recorded_by_name,
  d.note,
  d.donated_at,
  d.edited,
  d.edited_at,
  d.status,
  d.payment_method_code,
  pm.name_ar as payment_method_name_ar,
  pm.name_en as payment_method_name_en,
  d.payment_reference,
  d.confirmed_by,
  cnp.full_name as confirmed_by_name,
  d.confirmed_at,
  d.handover_id,
  d.proof_image_path,
  case
    when is_full_visibility_role() or d.member_id = auth.uid() or not fs.hide_amounts
      then d.gross_amount
    else null
  end as gross_amount,
  pm.fee_percent as payment_method_fee_percent
from donations d
join profiles mp on mp.id = d.member_id
left join profiles cp on cp.id = d.collected_by
join profiles rp on rp.id = d.recorded_by
left join payment_methods pm on pm.code = d.payment_method_code
left join profiles cnp on cnp.id = d.confirmed_by
cross join fund_settings fs
where is_approved();
