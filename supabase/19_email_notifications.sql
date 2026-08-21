-- ============================================================================
-- صندوق التعاضد العائلي — إشعارات بريد إلكتروني للمدير وأمين الصندوق (بالإضافة
-- لإشعار التطبيق، مش بدله) لما يصير شي بحاجة لتدخّلهم وهنّي مش فاتحين التطبيق.
-- شغّل هذا الملف بعد 18_targeted_notifications.sql. آمن على مشروع فيه بيانات
-- مسجّلة أصلاً (كله additive، ما في أي حذف).
--
-- خطوة يدوية وحيدة بعد تشغيل هذا الملف: شغّل هالسطر لحاله (غيّر القيمة
-- لأي سر تختاره، وحطّ نفس القيمة كـ NOTIFY_WEBHOOK_SECRET بمتغيرات البيئة
-- على Vercel):
--
--   select vault.create_secret('ضع-هون-سر-عشوائي-طويل', 'notify_webhook_secret');
--
-- هاد السر ما بينحفظ بملف SQL (ولا بأي مكان عالـ git — المستودع عام) — هو
-- الجسر الوحيد بين قاعدة البيانات و endpoint البريد، فبيتحط يدويًا مرة وحدة.
-- ============================================================================

create extension if not exists pg_net;

-- ----------------------------------------------------------------------------
-- submit_handover: نفس منطق الملف 14 بالضبط، بس هلق الإشعار موجّه لأمين
-- الصندوق حصرًا (كان بث عام لكل الأعضاء) — هو الوحيد يلي بيأكد الدفعة.
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

  insert into notifications (message_ar, message_en, sender_id, target_role)
  select
    format('📦 %s طلب تسليم دفعة تبرعات نقدية جديدة، بانتظار التأكيد.', p.full_name),
    format('📦 %s submitted a new cash handover batch, awaiting confirmation.', p.full_name),
    auth.uid(),
    'treasurer'
  from profiles p where p.id = auth.uid();

  return new_handover_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- set_donation_initial_status: نفس منطق الملف 17 بالضبط (حساب gross_amount +
-- تحديد الحالة)، بالإضافة لإشعار أمين الصندوق لما تبرع فردي (مش مجمّع بدفعة
-- جابي) يصير "قيد التأكيد" — تصريح عضو عن بعد، أو تبرع سجّله المدير مباشرة.
-- تبرعات الجابي النقدية ما بتنبّه هون لحالها؛ بتنبّه دفعة وحدة وقت طلب
-- التسليم (submit_handover فوق).
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
      insert into notifications (message_ar, message_en, target_role)
      values (
        format('💳 تبرّع جديد من %s بانتظار التأكيد.', donor_name),
        format('💳 New donation from %s is awaiting confirmation.', donor_name),
        'treasurer'
      );
    end if;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- notify_email_webhook: بيتنفّذ بعد أي إشعار جديد. إذا كان موجّه للمدير أو
-- أمين الصندوق بس، بيبعت طلب HTTP لـ /api/notify-email يلي بيرسل الإيميل
-- الفعلي (endpoint البريد نفسه محمي بالسر يلي بالـ Vault). إشعارات البث
-- العام (target_role فاضي) ما بترسل إيميل — بتضل بالتطبيق بس.
-- ----------------------------------------------------------------------------
create or replace function notify_email_webhook()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  secret text;
begin
  if new.target_role is null or new.target_role not in ('admin', 'treasurer') then
    return new;
  end if;

  select decrypted_secret into secret from vault.decrypted_secrets where name = 'notify_webhook_secret';
  if secret is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://sanad-fund.vercel.app/api/notify-email',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    body := jsonb_build_object(
      'message_ar', new.message_ar,
      'message_en', new.message_en,
      'target_role', new.target_role
    )
  );

  return new;
end;
$$;

drop trigger if exists notifications_email_webhook on notifications;
create trigger notifications_email_webhook
  after insert on notifications
  for each row execute function notify_email_webhook();
