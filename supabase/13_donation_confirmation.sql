-- ============================================================================
-- صندوق التعاضد العائلي — حالة تأكيد التبرع (pending/confirmed)
-- شغّل هذا الملف بعد 12_payment_methods.sql. آمن على مشروع فيه بيانات مسجّلة أصلاً
-- (التبرعات الموجودة أصلاً بتضل confirmed تلقائيًا عبر القيمة الافتراضية).
--
-- القاعدة: تبرع يسجله إدمن/أمين صندوق مباشرة = confirmed فورًا (هنّي أصلاً أمناء
-- الصندوق). تبرع يسجله جابي (كاش لسا ما سلّمه) أو عضو (تحويل خارجي لسا ما تأكد
-- وصوله) = pending لحد ما يأكد أمين الصندوق/الإدمن الاستلام الفعلي.
-- ============================================================================

alter table donations add column if not exists status text not null default 'confirmed'
  check (status in ('pending', 'confirmed'));
alter table donations add column if not exists payment_method_code text references payment_methods(code);
alter table donations add column if not exists payment_reference text;
alter table donations add column if not exists confirmed_by uuid references profiles(id);
alter table donations add column if not exists confirmed_at timestamptz;
alter table donations add column if not exists handover_id uuid; -- FK يُضاف بـ 14_handovers.sql بعد ما ينخلق الجدول

-- ----------------------------------------------------------------------------
-- trigger: يحسم حالة التبرع تلقائيًا حسب دور يلي سجّله — بغض النظر شو حاول
-- العميل يبعت، كرمال عضو ما يقدر "يزوّر" حاله كـ confirmed لتبرعه.
-- ----------------------------------------------------------------------------
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

  if recorder_role in ('admin', 'treasurer') then
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

drop trigger if exists donations_set_initial_status on donations;
create trigger donations_set_initial_status
  before insert on donations
  for each row execute function set_donation_initial_status();

-- ----------------------------------------------------------------------------
-- السماح للعضو العادي يصرّح بتبرعه هو بس (توسيعة عن "مشاهدة فقط")
-- ----------------------------------------------------------------------------
drop policy if exists donations_insert on donations;
create policy donations_insert on donations for insert
  with check (
    current_profile_role() in ('admin', 'treasurer', 'collector')
    or (current_profile_role() = 'member' and member_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- confirm_donation: تأكيد تبرع فردي (تبرعات الأعضاء عبر تحويل خارجي). تبرعات
-- الجابي المجمّعة بدفعة (handover_id مش فاضي) بتتأكد فقط عبر confirm_handover
-- بملف 14 كرمال يضل مجموع الدفعة متّسق.
-- ----------------------------------------------------------------------------
create or replace function confirm_donation(donation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_profile_role() not in ('admin', 'treasurer') then
    raise exception 'only the treasurer or admin can confirm donations';
  end if;

  update donations
  set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now()
  where id = donation_id and status = 'pending' and handover_id is null;
end;
$$;

grant execute on function confirm_donation(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- donations_feed: تحديث ليشمل الحالة، طريقة الدفع، ومين أكّد.
-- ----------------------------------------------------------------------------
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
  d.handover_id
from donations d
join profiles mp on mp.id = d.member_id
left join profiles cp on cp.id = d.collected_by
join profiles rp on rp.id = d.recorded_by
left join payment_methods pm on pm.code = d.payment_method_code
left join profiles cnp on cnp.id = d.confirmed_by
cross join fund_settings fs
where is_approved();

-- ----------------------------------------------------------------------------
-- fund_balances / monthly_report / period_report / monthly_donation_totals:
-- إعادة تعريف — تحسب التبرعات المؤكدة (confirmed) بس، متل ما expenses أصلاً
-- بتحسب المعتمدة (approved) بس.
-- ----------------------------------------------------------------------------
create or replace view fund_balances as
select
  cur.code as currency,
  coalesce((select sum(d.amount) from donations d where d.currency = cur.code and d.status = 'confirmed'), 0)
    - coalesce((select sum(e.amount) from expenses e where e.currency = cur.code and e.status = 'approved'), 0)
    as balance
from currencies cur
where is_approved();

create or replace function monthly_report(p_year int, p_month int)
returns table (
  currency text,
  opening_balance numeric,
  donations_total numeric,
  donations_count integer,
  expenses_total numeric,
  expenses_count integer,
  closing_balance numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with period as (
    select
      make_date(p_year, p_month, 1)::timestamptz as period_start,
      (make_date(p_year, p_month, 1) + interval '1 month')::timestamptz as period_end
  ),
  base as (
    select
      cur.code as currency,
      coalesce((
        select sum(d.amount) from donations d, period
        where d.currency = cur.code and d.status = 'confirmed' and d.donated_at < period.period_start
      ), 0) as opening_donations,
      coalesce((
        select sum(e.amount) from expenses e, period
        where e.currency = cur.code and e.status = 'approved' and e.spent_at < period.period_start
      ), 0) as opening_expenses,
      coalesce((
        select sum(d.amount) from donations d, period
        where d.currency = cur.code and d.status = 'confirmed'
          and d.donated_at >= period.period_start and d.donated_at < period.period_end
      ), 0) as donations_total,
      coalesce((
        select count(*) from donations d, period
        where d.currency = cur.code and d.status = 'confirmed'
          and d.donated_at >= period.period_start and d.donated_at < period.period_end
      ), 0)::int as donations_count,
      coalesce((
        select sum(e.amount) from expenses e, period
        where e.currency = cur.code and e.status = 'approved'
          and e.spent_at >= period.period_start and e.spent_at < period.period_end
      ), 0) as expenses_total,
      coalesce((
        select count(*) from expenses e, period
        where e.currency = cur.code and e.status = 'approved'
          and e.spent_at >= period.period_start and e.spent_at < period.period_end
      ), 0)::int as expenses_count
    from currencies cur
  )
  select
    currency,
    (opening_donations - opening_expenses) as opening_balance,
    donations_total,
    donations_count,
    expenses_total,
    expenses_count,
    (opening_donations - opening_expenses + donations_total - expenses_total) as closing_balance
  from base
  where is_approved();
$$;

create or replace function period_report(p_start date, p_end date)
returns table (
  currency text,
  opening_balance numeric,
  donations_total numeric,
  donations_count integer,
  expenses_total numeric,
  expenses_count integer,
  closing_balance numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with period as (
    select
      p_start::timestamptz as period_start,
      (p_end + 1)::timestamptz as period_end
  ),
  base as (
    select
      cur.code as currency,
      coalesce((
        select sum(d.amount) from donations d, period
        where d.currency = cur.code and d.status = 'confirmed' and d.donated_at < period.period_start
      ), 0) as opening_donations,
      coalesce((
        select sum(e.amount) from expenses e, period
        where e.currency = cur.code and e.status = 'approved' and e.spent_at < period.period_start
      ), 0) as opening_expenses,
      coalesce((
        select sum(d.amount) from donations d, period
        where d.currency = cur.code and d.status = 'confirmed'
          and d.donated_at >= period.period_start and d.donated_at < period.period_end
      ), 0) as donations_total,
      coalesce((
        select count(*) from donations d, period
        where d.currency = cur.code and d.status = 'confirmed'
          and d.donated_at >= period.period_start and d.donated_at < period.period_end
      ), 0)::int as donations_count,
      coalesce((
        select sum(e.amount) from expenses e, period
        where e.currency = cur.code and e.status = 'approved'
          and e.spent_at >= period.period_start and e.spent_at < period.period_end
      ), 0) as expenses_total,
      coalesce((
        select count(*) from expenses e, period
        where e.currency = cur.code and e.status = 'approved'
          and e.spent_at >= period.period_start and e.spent_at < period.period_end
      ), 0)::int as expenses_count
    from currencies cur
  )
  select
    currency,
    (opening_donations - opening_expenses) as opening_balance,
    donations_total,
    donations_count,
    expenses_total,
    expenses_count,
    (opening_donations - opening_expenses + donations_total - expenses_total) as closing_balance
  from base
  where is_approved();
$$;

create or replace function monthly_donation_totals()
returns table (month_start date, total numeric)
language sql
security definer
set search_path = public
stable
as $$
  select
    date_trunc('month', gs)::date as month_start,
    coalesce(sum(d.amount), 0) as total
  from generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  ) as gs
  left join donations d
    on d.currency = 'USD'
    and d.status = 'confirmed'
    and date_trunc('month', d.donated_at) = date_trunc('month', gs)
  where is_approved()
  group by 1
  order by 1;
$$;
