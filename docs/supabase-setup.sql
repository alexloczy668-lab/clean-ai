-- Clean AI — Supabase schema. Run in: Supabase dashboard -> SQL Editor.

-- Licence keys, one row per user (created on first login by the web app).
create table if not exists public.licenses (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null unique,
  status     text        not null default 'trial',   -- 'active' | 'trial' | 'none'
  created_at timestamptz not null default now(),
  primary key (user_id)
);

-- Row Level Security: each user can see and create only their own licence.
alter table public.licenses enable row level security;

-- Read own row.
create policy "read own licence"
  on public.licenses for select
  using (auth.uid() = user_id);

-- Insert own row (auto-generated on first login). status is pinned to 'trial'
-- so clients cannot self-grant 'active' — flip that server-side / via billing.
create policy "create own licence"
  on public.licenses for insert
  with check (auth.uid() = user_id and status = 'trial');

-- NOTE: no UPDATE/DELETE policy on purpose. Users can't change their own
-- status or key from the browser. Manage status with the service_role key
-- (backend / billing webhook) which bypasses RLS.

-- Licence validation RPC for the desktop app.
-- The Electron app has only the anon key, so it cannot read the licenses
-- table directly (RLS blocks it — auth.uid() is null). This SECURITY DEFINER
-- function runs as the table owner and returns only { status } for a match,
-- so anon callers can validate a key without being able to enumerate keys or
-- see other users' data. Rate-limit at the Supabase edge if abuse becomes a
-- concern.
create or replace function public.check_license(k text)
returns table (status text)
language sql
security definer
set search_path = public
as $$
  select l.status
  from public.licenses l
  where l.key = k
  limit 1;
$$;

revoke all on function public.check_license(text) from public;
grant execute on function public.check_license(text) to anon, authenticated;
