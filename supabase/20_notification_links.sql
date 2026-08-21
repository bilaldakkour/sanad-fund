-- ============================================================================
-- صندوق التعاضد العائلي — جعل الإشعارات قابلة للنقر: كل إشعار موجّه (طلب
-- انضمام، تبرع بانتظار التأكيد، دفعة تسليم) بياخد صاحبه مباشرة لمكان الطلب.
-- شغّل هذا الملف بعد 19_email_notifications.sql. آمن على مشروع فيه بيانات
-- مسجّلة أصلاً (كله additive، ما في أي حذف).
-- ============================================================================

alter table notifications add column if not exists link text;

-- ملاحظة: link مضاف بآخر قائمة SELECT (نفس سبب gross_amount بالملف 17) —
-- CREATE OR REPLACE VIEW ما بيسمح بإضافة عمود بنص القائمة.
create or replace view notifications_feed as
select
  n.id,
  n.message_ar,
  n.message_en,
  n.created_at,
  n.sender_id,
  sp.full_name as sender_name,
  n.target_role,
  n.link
from notifications n
left join profiles sp on sp.id = n.sender_id
where is_approved() and (n.target_role is null or n.target_role = current_profile_role())
order by n.created_at desc;

grant select on notifications_feed to authenticated;

-- ----------------------------------------------------------------------------
-- handle_new_user: نفس منطق الملف 18، بالإضافة لرابط يوصل المدير مباشرة
-- لقسم "طلبات الانضمام" بصفحة حسابي.
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

  insert into public.notifications (message_ar, message_en, target_role, link)
  values (
    format('📝 طلب انضمام جديد من %s — بانتظار المراجعة.', coalesce(new.raw_user_meta_data->>'full_name', new.email)),
    format('📝 New join request from %s — awaiting review.', coalesce(new.raw_user_meta_data->>'full_name', new.email)),
    'admin',
    format('/profile?highlight=%s', new.id)
  );

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- submit_handover: نفس منطق الملف 19، بالإضافة لرابط يوصل أمين الصندوق
-- مباشرة لدفعة التسليم بصفحة الموافقات.
-- ----------------------------------------------------------------------------
create or replace function submit_handover()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_handover_id uuid;
  pending_count integer;
begin
  if current_profile_role() not in ('collector', 'admin') then
    raise exception 'only a collector can submit a handover';
  end if;

  select count(*) into pending_count
  from donations
  where collected_by = auth.uid() and status = 'pending' and handover_id is null;

  if pending_count = 0 then
    raise exception 'no pending donations to hand over';
  end if;

  insert into handovers (collector_id) values (auth.uid()) returning id into new_handover_id;

  update donations
  set handover_id = new_handover_id
  where collected_by = auth.uid() and status = 'pending' and handover_id is null;

  insert into notifications (message_ar, message_en, sender_id, target_role, link)
  select
    format('📦 %s طلب تسليم دفعة تبرعات نقدية جديدة، بانتظار التأكيد.', p.full_name),
    format('📦 %s submitted a new cash handover batch, awaiting confirmation.', p.full_name),
    auth.uid(),
    'treasurer',
    format('/approvals?highlight=%s', new_handover_id)
  from profiles p where p.id = auth.uid();

  return new_handover_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- set_donation_initial_status: نفس منطق الملف 19، بالإضافة لرابط يوصل أمين
-- الصندوق مباشرة للتبرع الفردي بصفحة الموافقات.
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
  donor_name text;
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

    if new.collected_by is null then
      select full_name into donor_name from profiles where id = new.member_id;
      insert into notifications (message_ar, message_en, target_role, link)
      values (
        format('💳 تبرّع جديد من %s بانتظار التأكيد.', donor_name),
        format('💳 New donation from %s is awaiting confirmation.', donor_name),
        'treasurer',
        format('/approvals?highlight=%s', new.id)
      );
    end if;
  end if;

  return new;
end;
$$;
