-- ============================================================================
-- صندوق التعاضد العائلي — إشعارات موجّهة لدور معيّن + إشعار تلقائي للمدير عند
-- طلب انضمام جديد.
-- شغّل هذا الملف بعد 17_payment_method_enhancements.sql. آمن على مشروع فيه
-- بيانات مسجّلة أصلاً (كله additive، ما في أي حذف).
--
-- الإشعارات لحد هلق كانت كلها "بث عام" (كل عضو موافق عليه بيشوف كل إشعار).
-- هذا الملف بيضيف target_role اختياري: NULL = بث عام (نفس السلوك القديم)،
-- أو دور محدد ('admin' مثلًا) = ما بيظهر إلا لأصحاب هالدور.
-- ============================================================================

alter table notifications add column if not exists target_role text
  check (target_role is null or target_role in ('admin', 'treasurer', 'supervisor', 'collector', 'member'));

create or replace view notifications_feed as
select
  n.id,
  n.message_ar,
  n.message_en,
  n.created_at,
  n.sender_id,
  sp.full_name as sender_name,
  n.target_role
from notifications n
left join profiles sp on sp.id = n.sender_id
where is_approved() and (n.target_role is null or n.target_role = current_profile_role())
order by n.created_at desc;

grant select on notifications_feed to authenticated;

create or replace function unread_notifications_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from notifications n
  where is_approved()
    and (n.target_role is null or n.target_role = current_profile_role())
    and not exists (
      select 1 from notification_reads nr
      where nr.notification_id = n.id and nr.user_id = auth.uid()
    );
$$;

-- ----------------------------------------------------------------------------
-- handle_new_user: بالإضافة لإنشاء صف profiles، هلق بينبّه المدير بإشعار
-- بالتطبيق فور ما حدا يقدّم طلب انضمام.
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    'pending',
    'pending'
  );

  insert into public.notifications (message_ar, message_en, target_role)
  values (
    format('📝 طلب انضمام جديد من %s — بانتظار المراجعة.', coalesce(new.raw_user_meta_data->>'full_name', new.email)),
    format('📝 New join request from %s — awaiting review.', coalesce(new.raw_user_meta_data->>'full_name', new.email)),
    'admin'
  );

  return new;
end;
$$;
