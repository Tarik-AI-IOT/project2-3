-- Run this in Supabase SQL editor before using workout sync.

create extension if not exists pgcrypto;

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  session_data jsonb not null,
  total_exercises integer not null default 0,
  completed_exercises integer not null default 0,
  total_sets integer not null default 0,
  completed_sets integer not null default 0,
  completion_rate numeric(6,5) not null default 0,
  finished_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, date_key)
);

create index if not exists workout_sessions_user_date_idx
  on public.workout_sessions(user_id, date_key desc);

alter table public.workout_sessions enable row level security;

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
create policy "workout_sessions_select_own"
  on public.workout_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
create policy "workout_sessions_insert_own"
  on public.workout_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
create policy "workout_sessions_update_own"
  on public.workout_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;
create policy "workout_sessions_delete_own"
  on public.workout_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);
