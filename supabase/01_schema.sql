-- ============================================================================
-- صندوق التعاضد العائلي — Schema
-- شغّل هذا الملف أولاً بـ Supabase SQL Editor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ترقيم تسلسلي مشترك بين التبرعات والمصاريف (رقم الوصل بالسجل الكامل)
create sequence if not exists ledger_no_seq;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null,
  role text not null default 'pending'
    check (role in ('pending', 'admin', 'treasurer', 'supervisor', 'collector', 'member')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- currencies
-- ----------------------------------------------------------------------------
create table if not exists currencies (
  code text primary key,
  symbol text not null
);

insert into currencies (code, symbol) values ('USD', '$'), ('LBP', 'ل.ل')
  on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- fund_settings (صف وحيد)
-- ----------------------------------------------------------------------------
create table if not exists fund_settings (
  id smallint primary key default 1 check (id = 1),
  org_name_ar text not null default 'سَنَد',
  org_name_en text not null default 'Sanad',
  tagline_ar text not null default 'لا تجارة في هذا الصندوق، بل عائلة تحمي عائلتها.',
  tagline_en text not null default 'No business here — just a family protecting its own.',
  thank_you_ar text not null default 'جزاكم الله خيرًا، جعل الله تبرعكم في ميزان حسناتكم 🤍',
  thank_you_en text not null default 'Thank you — may this good deed stay with you always 🤍',
  hide_amounts boolean not null default true
);

insert into fund_settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- emergency_cases
-- ----------------------------------------------------------------------------
create table if not exists emergency_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'closed')),
  target_amount numeric,
  raised_amount numeric not null default 0,
  currency text not null default 'USD' references currencies(code),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- donations
-- ----------------------------------------------------------------------------
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  entry_no integer not null default nextval('ledger_no_seq'),
  member_id uuid not null references profiles(id),
  amount numeric not null check (amount > 0),
  currency text not null references currencies(code),
  exchange_rate numeric,
  collected_by uuid references profiles(id),
  recorded_by uuid not null references profiles(id),
  note text,
  donated_at timestamptz not null default now(),
  edited boolean not null default false,
  edited_at timestamptz
);

create unique index if not exists donations_entry_no_key on donations(entry_no);

-- ----------------------------------------------------------------------------
-- expenses
-- ----------------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  entry_no integer not null default nextval('ledger_no_seq'),
  title text not null,
  amount numeric not null check (amount > 0),
  currency text not null references currencies(code),
  exchange_rate numeric,
  reason text,
  case_id uuid references emergency_cases(id),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  treasurer_approved boolean not null default false,
  supervisor_approved boolean not null default false,
  balance_before numeric,
  balance_after numeric,
  recorded_by uuid not null references profiles(id),
  spent_at timestamptz not null default now()
);

create unique index if not exists expenses_entry_no_key on expenses(entry_no);

-- ----------------------------------------------------------------------------
-- notifications (تُنشأ فقط من داخل approve_expense، انظر 02_functions.sql)
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  message_ar text not null,
  message_en text not null,
  created_at timestamptz not null default now()
);
