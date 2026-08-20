-- ============================================================================
-- صندوق التعاضد العائلي — سجل تعديلات التبرعات (مين عدّل وشو غيّر بالضبط)
-- شغّل هذا الملف بعد 06_reports.sql. آمن على مشروع فيه بيانات مسجّلة أصلاً.
--
-- بدل ما نعتمد على الواجهة تبعت "شو تغيّر" (ممكن يصير فيها غلط أو تلاعب)، حطينا
-- trigger عالجدول نفسه: أي UPDATE عالتبرع (شخص/مبلغ/عملة/ملاحظة) بينسجل تلقائيًا
-- بجدول donation_edits مع هوية يلي عدّل — بغض النظر مين استدعى الـ update.
-- ============================================================================

create table if not exists donation_edits (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references donations(id) on delete cascade,
  edited_by uuid not null references profiles(id),
  edited_at timestamptz not null default now(),
  old_member_id uuid references profiles(id),
  new_member_id uuid references profiles(id),
  old_amount numeric,
  new_amount numeric,
  old_currency text,
  new_currency text,
  old_note text,
  new_note text
);

create index if not exists donation_edits_donation_id_idx on donation_edits(donation_id);

alter table donation_edits enable row level security;

drop policy if exists donation_edits_select on donation_edits;
create policy donation_edits_select on donation_edits for select
  using (is_approved());

-- لا INSERT/UPDATE/DELETE policy: يصير فقط من داخل الـ trigger تحت (SECURITY DEFINER).
revoke insert, update, delete on donation_edits from authenticated;

create or replace function log_donation_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.member_id, old.amount, old.currency, coalesce(old.note, '')) is distinct from
     (new.member_id, new.amount, new.currency, coalesce(new.note, '')) then
    insert into donation_edits (
      donation_id, edited_by,
      old_member_id, new_member_id,
      old_amount, new_amount,
      old_currency, new_currency,
      old_note, new_note
    ) values (
      new.id, auth.uid(),
      old.member_id, new.member_id,
      old.amount, new.amount,
      old.currency, new.currency,
      old.note, new.note
    );
  end if;
  return new;
end;
$$;

drop trigger if exists donations_log_edit on donations;
create trigger donations_log_edit
  after update on donations
  for each row execute function log_donation_edit();

-- ----------------------------------------------------------------------------
-- donation_edits_feed: نفس السجل بس بأسماء جاهزة للعرض (مين عدّل، اسم العضو
-- قبل/بعد إذا تغيّر) بدل معرّفات uuid خام.
-- ----------------------------------------------------------------------------
create or replace view donation_edits_feed as
select
  de.id,
  de.donation_id,
  de.edited_at,
  ep.full_name as edited_by_name,
  omp.full_name as old_member_name,
  nmp.full_name as new_member_name,
  de.old_amount,
  de.new_amount,
  de.old_currency,
  de.new_currency,
  de.old_note,
  de.new_note
from donation_edits de
join profiles ep on ep.id = de.edited_by
left join profiles omp on omp.id = de.old_member_id
left join profiles nmp on nmp.id = de.new_member_id
where is_approved()
order by de.edited_at desc;

grant select on donation_edits_feed to authenticated;
