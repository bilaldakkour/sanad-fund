-- ============================================================================
-- صندوق التعاضد العائلي — التقرير الشهري (مركز التدقيق المالي)
-- شغّل هذا الملف بعد 04_views.sql (ما بيأثر على أي جدول موجود، آمن تشغيله على
-- مشروع فيه بيانات مسجّلة أصلاً).
--
-- monthly_report: لكل عملة — الرصيد الافتتاحي (كل شي قبل بداية الشهر)، مجموع
-- التبرعات والمصاريف المعتمدة خلال الشهر، والرصيد الختامي. رقم مجمّع فقط
-- (مش حركات فردية)، فآمن لأي عضو موافق عليه بغض النظر عن hide_amounts.
-- ============================================================================

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
        where d.currency = cur.code and d.donated_at < period.period_start
      ), 0) as opening_donations,
      coalesce((
        select sum(e.amount) from expenses e, period
        where e.currency = cur.code and e.status = 'approved' and e.spent_at < period.period_start
      ), 0) as opening_expenses,
      coalesce((
        select sum(d.amount) from donations d, period
        where d.currency = cur.code and d.donated_at >= period.period_start and d.donated_at < period.period_end
      ), 0) as donations_total,
      coalesce((
        select count(*) from donations d, period
        where d.currency = cur.code and d.donated_at >= period.period_start and d.donated_at < period.period_end
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

grant execute on function monthly_report(int, int) to authenticated;
