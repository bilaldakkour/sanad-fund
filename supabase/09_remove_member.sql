-- ============================================================================
-- صندوق التعاضد العائلي — طرد/إزالة عضو نهائيًا من الصندوق
-- شغّل هذا الملف بعد 08_period_report.sql.
--
-- ⚠️ ليش ما منعمل DELETE فعلي عالصف بجدول profiles:
-- كل تبرع ومصروف بالنظام مرتبط بـ member_id/recorded_by/collected_by يشاور عالعضو
-- (foreign key). لو حذفنا صف العضو فعليًا:
--   - إما العملية بترفض تلقائيًا (لأنه في تبرعات مرتبطة فيه) وما رح تنجح أصلاً،
--   - أو (لو حطينا cascade) رح تنمحى معه كل تبرعاته وسجله المالي — وهاد بالضبط
--     الشي يلي مبدأ الشفافية بالمشروع بيمنعه (audit trail كامل بدون حذف، حتى
--     لو العضو نفسه طلع من الصندوق).
--
-- الحل: "إزالة" العضو = يفقد الوصول للتطبيق فورًا (status='removed')، بينشال من
-- قائمة الأعضاء المعتمدين، بس اسمه بيضل يبين صحيح جنب كل حركة سجّلها قبل ما ينشال
-- (تماشيًا مع "ما في حذف أبدًا لأي حركة مالية"). لو بدك حذف فعلي 100% من قاعدة
-- البيانات لعضو ما سجّل ولا حركة أبدًا، فيك تعمله يدويًا من Supabase مباشرة.
-- ============================================================================

alter table profiles drop constraint if exists profiles_status_check;
alter table profiles add constraint profiles_status_check
  check (status in ('pending', 'approved', 'rejected', 'removed'));

create or replace function remove_member(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'only an admin can remove members';
  end if;

  if target = auth.uid() then
    raise exception 'you cannot remove your own account';
  end if;

  update profiles
  set status = 'removed'
  where id = target and status = 'approved';
end;
$$;

grant execute on function remove_member(uuid) to authenticated;
