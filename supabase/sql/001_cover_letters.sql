-- Run this in Supabase: SQL Editor → New query → Paste → Run
-- Creates public.cover_letters (used by /api/cover-letter and /api/cover-letter/history)

create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_title text not null,
  company_name text not null,
  job_description text,
  tone text,
  generated_letter text not null,
  created_at timestamptz not null default now()
);

create index if not exists cover_letters_user_id_created_at_idx
  on public.cover_letters (user_id, created_at desc);

alter table public.cover_letters enable row level security;

-- Idempotent policies (safe to re-run)
drop policy if exists "cover_letters_select_own" on public.cover_letters;
drop policy if exists "cover_letters_insert_own" on public.cover_letters;
drop policy if exists "cover_letters_update_own" on public.cover_letters;
drop policy if exists "cover_letters_delete_own" on public.cover_letters;

-- Authenticated users can only access their own rows
create policy "cover_letters_select_own"
  on public.cover_letters for select
  to authenticated
  using (user_id = auth.uid());

create policy "cover_letters_insert_own"
  on public.cover_letters for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "cover_letters_update_own"
  on public.cover_letters for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cover_letters_delete_own"
  on public.cover_letters for delete
  to authenticated
  using (user_id = auth.uid());
