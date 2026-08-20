-- ============================================================================
-- صندوق التعاضد العائلي — دفعات تسليم الجابي (batch handover)
-- شغّل هذا الملف بعد 13_donation_confirmation.sql.
--
-- الجابي بيجمع كاش من كذا شخص باليوم — تأكيد كل تبرع لحاله تعب لأمين الصندوق.
-- بدل هيك: الجابي يضغط "طلب تسليم" فتتجمع كل تبرعاته المعلّقة الحرة بدفعة وحدة،
-- وأمين الصندوق/الإدمن يأكد الدفعة كاملة بضغطة وحدة.
-- ============================================================================

create table if not exists handovers (
  id uuid primary key default gen_random_uuid(),
  collector_id uuid not null references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  created_at timestamptz not null default now(),
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz
);

alter table donations add constraint donations_handover_id_fkey
  foreign key (handover_id) references handovers(id);

alter table handovers enable row level security;

drop policy if exists handovers_select on handovers;
create policy handovers_select on handovers for select
  using (collector_id = auth.uid() or current_profile_role() in ('admin', 'treasurer'));

-- لا INSERT/UPDATE/DELETE مباشر — بس عبر الـ RPCs تحت.
revoke insert, update, delete on handovers from authenticated;

-- ----------------------------------------------------------------------------
-- submit_handover: الجابي يجمع كل تبرعاته المعلّقة غير المسلّمة بعد بدفعة جديدة.
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

  insert into notifications (message_ar, message_en, sender_id)
  select
    format('📦 %s طلب تسليم دفعة تبرعات نقدية جديدة، بانتظار التأكيد.', p.full_name),
    format('📦 %s submitted a new cash handover batch, awaiting confirmation.', p.full_name),
    auth.uid()
  from profiles p where p.id = auth.uid();

  return new_handover_id;
end;
$$;

grant execute on function submit_handover() to authenticated;

-- ----------------------------------------------------------------------------
-- confirm_handover: أمين الصندوق/الإدمن يأكد استلام الدفعة كاملة بمعاملة وحدة.
-- ----------------------------------------------------------------------------
create or replace function confirm_handover(handover_id_param uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  h handovers%rowtype;
begin
  if current_profile_role() not in ('admin', 'treasurer') then
    raise exception 'only the treasurer or admin can confirm a handover';
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

grant execute on function confirm_handover(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- handovers_feed: نفس السجل بس بأسماء جاهزة للعرض.
-- ----------------------------------------------------------------------------
create or replace view handovers_feed as
select
  h.id,
  h.collector_id,
  cp.full_name as collector_name,
  h.status,
  h.created_at,
  h.confirmed_by,
  cnp.full_name as confirmed_by_name,
  h.confirmed_at
from handovers h
join profiles cp on cp.id = h.collector_id
left join profiles cnp on cnp.id = h.confirmed_by
where h.collector_id = auth.uid() or is_full_visibility_role()
order by h.created_at desc;

grant select on handovers_feed to authenticated;
