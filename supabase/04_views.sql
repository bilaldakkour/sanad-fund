-- ============================================================================
-- صندوق التعاضد العائلي — Views
-- شغّل هذا الملف بعد 03_policies.sql.
--
-- donations_feed: مسار القراءة الآمن لسجل التبرعات — يطبّق منطق إخفاء المبلغ
-- (hide_amounts) داخل الـ SQL مباشرة (مو بالواجهة بس)، ويرجع اسم العضو صاحب
-- التبرع، اسم يلي قبض المبلغ، واسم يلي سجّله، جاهزين للعرض.
-- ============================================================================

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
  d.edited_at
from donations d
join profiles mp on mp.id = d.member_id
left join profiles cp on cp.id = d.collected_by
join profiles rp on rp.id = d.recorded_by
cross join fund_settings fs
where is_approved();

grant select on donations_feed to authenticated;

-- ----------------------------------------------------------------------------
-- expenses_feed: نفس فكرة donations_feed بس بدون إخفاء مبلغ (expenses شفافة كاملة)،
-- بس بترجع اسم يلي سجّلها جاهز للعرض بدل جلبه بـ join منفصل بالواجهة.
-- ----------------------------------------------------------------------------
create or replace view expenses_feed as
select
  e.id,
  e.entry_no,
  e.title,
  e.amount,
  e.currency,
  e.exchange_rate,
  e.reason,
  e.case_id,
  e.status,
  e.treasurer_approved,
  e.supervisor_approved,
  e.balance_before,
  e.balance_after,
  e.recorded_by,
  rp.full_name as recorded_by_name,
  e.spent_at
from expenses e
join profiles rp on rp.id = e.recorded_by
where is_approved();

grant select on expenses_feed to authenticated;

-- ----------------------------------------------------------------------------
-- fund_balances: الرصيد الإجمالي بكل عملة — رقم مجمّع فقط (مش حركات فردية)،
-- فآمن يشوفه أي عضو موافق عليه بغض النظر عن hide_amounts (يلي بتخبي حركات
-- فردية بين الأعضاء، مو مجموع الصندوق العام).
-- ----------------------------------------------------------------------------
create or replace view fund_balances as
select
  cur.code as currency,
  coalesce((select sum(d.amount) from donations d where d.currency = cur.code), 0)
    - coalesce((select sum(e.amount) from expenses e where e.currency = cur.code and e.status = 'approved'), 0)
    as balance
from currencies cur
where is_approved();

grant select on fund_balances to authenticated;

-- ----------------------------------------------------------------------------
-- monthly_donation_totals: مجموع تبرعات USD شهريًا لآخر 6 أشهر (لرسم بياني
-- تقديري بالداشبورد) — رقم مجمّع فقط، آمن لكل عضو موافق عليه.
-- ----------------------------------------------------------------------------
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
    and date_trunc('month', d.donated_at) = date_trunc('month', gs)
  where is_approved()
  group by 1
  order by 1;
$$;

grant execute on function monthly_donation_totals() to authenticated;
