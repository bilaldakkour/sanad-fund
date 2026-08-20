-- ============================================================================
-- صندوق التعاضد العائلي — صورة إثبات التحويل (سكرين شوت) عند تصريح العضو بتبرع
-- شغّل هذا الملف بعد 14_handovers.sql.
--
-- الصور بتتخزن بـ Storage bucket خاص (private) — مش عام أبدًا. بس صاحب التبرع
-- (يلي رفعها) وأمين الصندوق/الإدمن يقدروا يشوفوها، عبر رابط موقّع (signed URL)
-- مؤقت بيتولّد وقت عرض صفحة الموافقات — الصورة نفسها ما تنكشف لباقي الأعضاء
-- (خصوصية مالية للمتبرع).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-proofs',
  'donation-proofs',
  false,
  5242880, -- 5MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/heic']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

-- بنية المسار: {user_id}/{اسم-ملف} — كل عضو بيرفع بس جوا مجلده هو.
drop policy if exists donation_proofs_insert on storage.objects;
create policy donation_proofs_insert on storage.objects for insert
  with check (
    bucket_id = 'donation-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists donation_proofs_select on storage.objects;
create policy donation_proofs_select on storage.objects for select
  using (
    bucket_id = 'donation-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or current_profile_role() in ('admin', 'treasurer')
    )
  );

-- لا UPDATE/DELETE — نفس مبدأ "ما في حذف أبدًا" المطبّق عالتبرعات.

alter table donations add column if not exists proof_image_path text;

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
  d.proof_image_path
from donations d
join profiles mp on mp.id = d.member_id
left join profiles cp on cp.id = d.collected_by
join profiles rp on rp.id = d.recorded_by
left join payment_methods pm on pm.code = d.payment_method_code
left join profiles cnp on cnp.id = d.confirmed_by
cross join fund_settings fs
where is_approved();
