-- ============================================================================
-- صندوق التعاضد العائلي — إشعارات يبعتها المدير/أمين الصندوق/المشرف لكل الأعضاء
-- شغّل هذا الملف بعد 09_remove_member.sql. آمن على مشروع فيه بيانات مسجّلة أصلاً.
-- ============================================================================

alter table notifications add column if not exists sender_id uuid references profiles(id);

create or replace function send_announcement(message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_profile_role() not in ('admin', 'treasurer', 'supervisor') then
    raise exception 'only an admin, treasurer, or supervisor can send announcements';
  end if;

  if trim(message) = '' then
    raise exception 'message cannot be empty';
  end if;

  insert into notifications (message_ar, message_en, sender_id)
  values (message, message, auth.uid());
end;
$$;

grant execute on function send_announcement(text) to authenticated;

-- ----------------------------------------------------------------------------
-- notifications_feed: نفس سجل الإشعارات بس مع اسم يلي بعتها جاهز للعرض (فاضي
-- لإشعارات النظام التلقائية متل دفع مصروف).
-- ----------------------------------------------------------------------------
create or replace view notifications_feed as
select
  n.id,
  n.message_ar,
  n.message_en,
  n.created_at,
  n.sender_id,
  sp.full_name as sender_name
from notifications n
left join profiles sp on sp.id = n.sender_id
where is_approved()
order by n.created_at desc;

grant select on notifications_feed to authenticated;
