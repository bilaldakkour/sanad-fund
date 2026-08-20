-- ============================================================================
-- صندوق التعاضد العائلي — تعليم الإشعارات "مقروءة" لكل مستخدم لحاله
-- شغّل هذا الملف بعد 10_announcements.sql. آمن على مشروع فيه بيانات مسجّلة أصلاً.
--
-- الإشعارات نفسها مشتركة بين كل الأعضاء (سجل واحد للجميع)، فـ"مقروء" لازم يكون
-- خاص لكل عضو لحاله (لو حدا فتحها ما لازم تصير مقروءة عند الباقي).
-- ============================================================================

create table if not exists notification_reads (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table notification_reads enable row level security;

drop policy if exists notification_reads_select on notification_reads;
create policy notification_reads_select on notification_reads for select
  using (user_id = auth.uid());

drop policy if exists notification_reads_insert on notification_reads;
create policy notification_reads_insert on notification_reads for insert
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- unread_notifications_count: عدد الإشعارات يلي المستخدم الحالي لسا ما فتحها.
-- ----------------------------------------------------------------------------
create or replace function unread_notifications_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from notifications n
  where is_approved()
    and not exists (
      select 1 from notification_reads nr
      where nr.notification_id = n.id and nr.user_id = auth.uid()
    );
$$;

grant execute on function unread_notifications_count() to authenticated;
