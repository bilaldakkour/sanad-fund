-- ============================================================================
-- صندوق التعاضد العائلي — Functions & Triggers
-- شغّل هذا الملف بعد 01_schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helpers مستخدمة داخل RLS policies (SECURITY DEFINER لتفادي recursion على profiles)
-- ----------------------------------------------------------------------------
create or replace function current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and status = 'approved'
  );
$$;

create or replace function is_full_visibility_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'treasurer', 'supervisor') and status = 'approved'
  );
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

-- ----------------------------------------------------------------------------
-- إنشاء صف profiles تلقائيًا عند تسجيل مستخدم جديد بـ Supabase Auth
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    'pending',
    'pending'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- موافقة/رفض/تغيير دور عضو — إدمن فقط
-- ----------------------------------------------------------------------------
create or replace function approve_member(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'only an admin can approve members';
  end if;

  update profiles
  set status = 'approved', role = 'member'
  where id = target and status = 'pending';
end;
$$;

create or replace function reject_member(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'only an admin can reject members';
  end if;

  -- الصف يبقى (status='rejected') بدل الحذف، كرمال يقدر المستخدم يشوف رسالة
  -- الرفض لما يحاول يسجل دخول، وكرمال يضل أثر القرار موجود.
  update profiles
  set status = 'rejected'
  where id = target and status = 'pending';
end;
$$;

create or replace function set_member_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'only an admin can change roles';
  end if;

  if new_role not in ('admin', 'treasurer', 'supervisor', 'collector', 'member') then
    raise exception 'invalid role %', new_role;
  end if;

  update profiles
  set role = new_role
  where id = target and status = 'approved';
end;
$$;

-- ----------------------------------------------------------------------------
-- موافقة مزدوجة على مصروف — يحسب الرصيد على السيرفر عند اكتمال الموافقتين
-- as_role: 'treasurer' | 'supervisor' — الإدمن يقدر يوقّع مكان أي منهم
-- ----------------------------------------------------------------------------
create or replace function approve_expense(expense_id uuid, as_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := current_profile_role();
  exp expenses%rowtype;
  current_balance numeric;
  msg_ar text;
  msg_en text;
begin
  if as_role not in ('treasurer', 'supervisor') then
    raise exception 'invalid approval role %', as_role;
  end if;

  if caller_role <> as_role and caller_role <> 'admin' then
    raise exception 'not authorized to approve as %', as_role;
  end if;

  select * into exp from expenses where id = expense_id for update;
  if not found then
    raise exception 'expense not found';
  end if;

  if exp.status = 'approved' then
    return; -- already fully approved, nothing to do
  end if;

  if as_role = 'treasurer' then
    update expenses set treasurer_approved = true where id = expense_id;
  else
    update expenses set supervisor_approved = true where id = expense_id;
  end if;

  select * into exp from expenses where id = expense_id for update;

  if exp.treasurer_approved and exp.supervisor_approved then
    select coalesce(sum(case when d.currency = exp.currency then d.amount else 0 end), 0)
      - coalesce((
          select sum(e.amount) from expenses e
          where e.currency = exp.currency and e.status = 'approved'
        ), 0)
    into current_balance
    from donations d
    where d.currency = exp.currency;

    update expenses
    set status = 'approved',
        balance_before = current_balance,
        balance_after = current_balance - exp.amount
    where id = expense_id;

    msg_ar := format('📤 تم دفع %s %s عن «%s». الرصيد المتبقي: %s %s',
      exp.amount, exp.currency, exp.title, (current_balance - exp.amount), exp.currency);
    msg_en := format('📤 Paid %s %s for "%s". Remaining balance: %s %s',
      exp.amount, exp.currency, exp.title, (current_balance - exp.amount), exp.currency);

    insert into notifications (message_ar, message_en) values (msg_ar, msg_en);
  end if;
end;
$$;

grant execute on function approve_member(uuid) to authenticated;
grant execute on function reject_member(uuid) to authenticated;
grant execute on function set_member_role(uuid, text) to authenticated;
grant execute on function approve_expense(uuid, text) to authenticated;
