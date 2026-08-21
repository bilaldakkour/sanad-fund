-- ============================================================================
-- صندوق التعاضد العائلي — رفض تبرع فردي بانتظار التأكيد، مع سبب إلزامي.
-- شغّل هذا الملف بعد 20_notification_links.sql. آمن على مشروع فيه بيانات
-- مسجّلة أصلاً (كله additive، ما في أي حذف — التبرع المرفوض بيضل بالسجل
-- للأبد، بس بحالة "مرفوض" بدل ما يختفي، نفس مبدأ الشفافية الكامل بالمشروع).
-- ============================================================================

alter table donations add column if not exists rejection_reason text;
alter table donations add column if not exists rejected_by uuid references profiles(id);
alter table donations add column if not exists rejected_at timestamptz;

alter table donations drop constraint if exists donations_status_check;
alter table donations add constraint donations_status_check
  check (status in ('pending', 'confirmed', 'rejected'));

-- ----------------------------------------------------------------------------
-- reject_donation: نفس صلاحية confirm_donation بالضبط — أمين الصندوق حصرًا.
-- سبب الرفض إلزامي (ما منسمح رفض بلا تفسير)، وبيضل ظاهر بالسجل للأبد.
-- ----------------------------------------------------------------------------
create or replace function reject_donation(donation_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_profile_role() <> 'treasurer' then
    raise exception 'only the treasurer can reject donations';
  end if;

  if trim(coalesce(reason, '')) = '' then
    raise exception 'a rejection reason is required';
  end if;

  update donations
  set status = 'rejected', rejected_by = auth.uid(), rejected_at = now(), rejection_reason = trim(reason)
  where id = donation_id and status = 'pending' and handover_id is null;
end;
$$;

grant execute on function reject_donation(uuid, text) to authenticated;

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
  pm.fee_percent as payment_method_fee_percent,
  d.rejection_reason,
  d.rejected_by,
  rjp.full_name as rejected_by_name,
  d.rejected_at
from donations d
join profiles mp on mp.id = d.member_id
left join profiles cp on cp.id = d.collected_by
join profiles rp on rp.id = d.recorded_by
left join payment_methods pm on pm.code = d.payment_method_code
left join profiles cnp on cnp.id = d.confirmed_by
left join profiles rjp on rjp.id = d.rejected_by
cross join fund_settings fs
where is_approved();
