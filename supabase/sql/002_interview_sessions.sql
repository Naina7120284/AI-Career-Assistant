-- Run in Supabase SQL Editor (idempotent)
-- Used by Interview Prep: list + create sessions

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  type text not null,
  score integer not null default 0,
  duration integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists interview_sessions_user_id_created_at_idx
  on public.interview_sessions (user_id, created_at desc);

alter table public.interview_sessions enable row level security;

drop policy if exists "interview_sessions_select_own" on public.interview_sessions;
drop policy if exists "interview_sessions_insert_own" on public.interview_sessions;
drop policy if exists "interview_sessions_update_own" on public.interview_sessions;
drop policy if exists "interview_sessions_delete_own" on public.interview_sessions;

create policy "interview_sessions_select_own"
  on public.interview_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "interview_sessions_insert_own"
  on public.interview_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "interview_sessions_update_own"
  on public.interview_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "interview_sessions_delete_own"
  on public.interview_sessions for delete
  to authenticated
  using (user_id = auth.uid());
