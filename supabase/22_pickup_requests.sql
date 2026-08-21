-- ============================================================================
-- صندوق التعاضد العائلي — طلب "مرور الجابي": عضو يطلب تبرّع نقدي يدوي، بيوصل
-- إشعار لكل الجباة، وأول واحد يقبض المبلغ فعليًا بيسجّله كتبرع عادي (بيطبع
-- وصل فورًا، وبيضل عنده لحد ما يسلّمه لأمين الصندوق — نفس تدفق التسليم
-- الموجود أصلاً بالملف 14).
-- شغّل هذا الملف بعد 21_donation_rejection.sql. آمن على مشروع فيه بيانات
-- مسجّلة أصلاً (كله additive، ما في أي حذف).
--
-- ملاحظة تصميم: طلب المرور نفسه مش حركة مالية (ما في مبلغ تحرّك فعليًا لسا)،
-- فمنخزّنه بجدول منفصل عن donations — وبس لما الجابي يقبض فعليًا، بينخلق صف
-- donations حقيقي (بنفس trigger الحساب الموجود أصلاً set_donation_initial_status).
-- ============================================================================

create table if not exists pickup_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references profiles(id),
  amount numeric not null check (amount > 0),
  currency text not null references currencies(code),
  status text not null default 'pending' check (status in ('pending', 'collected', 'cancelled')),
  collected_by uuid references profiles(id),
  donation_id uuid references donations(id),
  created_at timestamptz not null default now(),
  collected_at timestamptz
);

alter table pickup_requests enable row level security;

drop policy if exists pickup_requests_select on pickup_requests;
create policy pickup_requests_select on pickup_requests for select
  using (member_id = auth.uid() or current_profile_role() in ('collector', 'admin', 'treasurer'));

-- لا INSERT/UPDATE/DELETE مباشر — بس عبر الـ RPCs تحت.
revoke insert, update, delete on pickup_requests from authenticated;

-- ----------------------------------------------------------------------------
-- request_pickup: عضو موافق عليه بيطلب مرور الجابي بمبلغ معيّن — بيوصل إشعار
-- لكل الجباة.
-- ----------------------------------------------------------------------------
create or replace function request_pickup(amount numeric, currency text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  requester_name text;
begin
  if not is_approved() then
    raise exception 'only an approved member can request a pickup';
  end if;

  if amount is null or amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  insert into pickup_requests (member_id, amount, currency)
  values (auth.uid(), amount, currency)
  returning id into new_id;

  select full_name into requester_name from profiles where id = auth.uid();

  insert into notifications (message_ar, message_en, sender_id, target_role, link)
  values (
    format('🤝 %s طلب مرور الجابي لقبض تبرع نقدي.', requester_name),
    format('🤝 %s requested a cash pickup.', requester_name),
    auth.uid(),
    'collector',
    format('/handover?highlight=%s', new_id)
  );

  return new_id;
end;
$$;

grant execute on function request_pickup(numeric, text) to authenticated;

-- ----------------------------------------------------------------------------
-- cancel_pickup_request: صاحب الطلب بس يقدر يلغي طلبه، وبس لسا "قيد الانتظار".
-- ----------------------------------------------------------------------------
create or replace function cancel_pickup_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update pickup_requests
  set status = 'cancelled'
  where id = request_id and member_id = auth.uid() and status = 'pending';
end;
$$;

grant execute on function cancel_pickup_request(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- collect_pickup_request: جابي (أو إدمن) بيأكد إنو قبض المبلغ فعليًا — هون
-- بينخلق صف donations حقيقي (نفس منطق addDonation العادي: collected_by
-- الجابي، recorded_by الجابي، status بيتحدد تلقائيًا بـ trigger موجود أصلاً)،
-- وبيرجّع تفاصيله كرمال يطبع وصل فورًا للمتبرّع (نفس فكرة الملف 8dab58b).
-- ----------------------------------------------------------------------------
create or replace function collect_pickup_request(request_id uuid)
returns table (donation_id uuid, entry_no integer, donated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  req pickup_requests%rowtype;
  new_donation_id uuid;
  new_entry_no integer;
  new_donated_at timestamptz;
begin
  if current_profile_role() not in ('collector', 'admin') then
    raise exception 'only a collector can collect a pickup request';
  end if;

  select * into req from pickup_requests where id = request_id and status = 'pending' for update;
  if not found then
    raise exception 'pickup request not found or already handled';
  end if;

  insert into donations (member_id, amount, currency, collected_by, recorded_by)
  values (req.member_id, req.amount, req.currency, auth.uid(), auth.uid())
  returning id, entry_no, donated_at into new_donation_id, new_entry_no, new_donated_at;

  update pickup_requests
  set status = 'collected', collected_by = auth.uid(), collected_at = now(), donation_id = new_donation_id
  where id = request_id;

  return query select new_donation_id, new_entry_no, new_donated_at;
end;
$$;

grant execute on function collect_pickup_request(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- pickup_requests_feed: نفس السجل بأسماء جاهزة للعرض.
-- ----------------------------------------------------------------------------
create or replace view pickup_requests_feed as
select
  pr.id,
  pr.member_id,
  mp.full_name as member_name,
  pr.amount,
  pr.currency,
  pr.status,
  pr.collected_by,
  cp.full_name as collected_by_name,
  pr.donation_id,
  pr.created_at,
  pr.collected_at
from pickup_requests pr
join profiles mp on mp.id = pr.member_id
left join profiles cp on cp.id = pr.collected_by
where pr.member_id = auth.uid() or current_profile_role() in ('collector', 'admin', 'treasurer')
order by pr.created_at desc;

grant select on pickup_requests_feed to authenticated;
