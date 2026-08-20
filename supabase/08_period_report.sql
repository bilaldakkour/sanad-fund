-- ============================================================================
-- صندوق التعاضد العائلي — تقرير بفترة حرة (يومي / أسبوعي / شهري / مخصص)
-- شغّل هذا الملف بعد 07_donation_edits.sql. آمن على مشروع فيه بيانات مسجّلة أصلاً.
--
-- period_report: نفس فكرة monthly_report بس بفترة حرة [p_start, p_end] (بالتاريخ،
-- والاتنين شاملين) بدل شهر ثابت — هيك بيغطي كل أنواع التقارير (يوم واحد، أسبوع،
-- شهر، أو أي مدى تاريخ يختاره المستخدم).
-- ============================================================================

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

grant execute on function period_report(date, date) to authenticated;
