-- ============================================================================
-- صندوق التعاضد العائلي — أمين الصندوق هو الوحيد يلي يأكد التبرعات
-- شغّل هذا الملف بعد 15_donation_proof.sql.
--
-- تعديل مبدأ التأكيد: أي تبرع يسجّله أي حدا (حتى المدير نفسه) بيضل "قيد
-- الانتظار" لحد ما يوافق عليه أمين الصندوق بالذات — المدير ما عاد يقدر يأكد
-- تبرعات ولا دفعات تسليم (بس يشوفها للمتابعة). الاستثناء الوحيد: تبرع يسجله
-- أمين الصندوق بنفسه بينحسب فورًا (هو أصلاً الجهة يلي بتأكد).
-- ============================================================================

create or replace function set_donation_initial_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recorder_role text;
begin
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

create or replace function confirm_donation(donation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_profile_role() <> 'treasurer' then
    raise exception 'only the treasurer can confirm donations';
  end if;

  update donations
  set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now()
  where id = donation_id and status = 'pending' and handover_id is null;
end;
$$;

create or replace function confirm_handover(handover_id_param uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  h handovers%rowtype;
begin
  if current_profile_role() <> 'treasurer' then
    raise exception 'only the treasurer can confirm a handover';
  end if;

  select * into h from handovers where id = handover_id_param for update;
  if not found then
    raise exception 'handover not found';
  end if;
  if h.status = 'confirmed' then
    return;
  end if;

  update donations
  set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now()
  where handover_id = handover_id_param;

  update handovers
  set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now()
  where id = handover_id_param;

  insert into notifications (message_ar, message_en, sender_id)
  select
    format('✅ تم تأكيد استلام دفعة التسليم من %s.', cp.full_name),
    format('✅ Handover batch from %s confirmed as received.', cp.full_name),
    auth.uid()
  from profiles cp where cp.id = h.collector_id;
end;
$$;
